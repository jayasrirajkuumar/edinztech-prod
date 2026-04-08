const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Program = require('../models/Program');
const Payment = require('../models/Payment');
const { sendEmail } = require('../services/emailService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const eventBus = require('../events/eventBus');
const { encrypt, decrypt, generateUserCode } = require('../utils/encryption');

const inviteStudent = async (req, res) => {
    try {
        const { email, phone, programId, name, year, department, registerNumber, institutionName, state, city, pincode } = req.body;

        if (!email || !programId) {
            return res.status(400).json({ message: 'Email and Program ID are required' });
        }

        // 1. Verify Program
        const program = await Program.findById(programId);
        if (!program) {
            return res.status(404).json({ message: 'Program not found' });
        }

        // 2. Check User
        let user = await User.findOne({ email });
        let isNewUser = false;
        let passwordString = '';

        if (!user) {
            isNewUser = true;
            passwordString = crypto.randomBytes(8).toString('hex'); // Stronger password (16 chars)
            const username = name || (email.split('@')[0] + Math.floor(1000 + Math.random() * 9000));

            // Generate User Code
            const userCode = generateUserCode();

            user = await User.create({
                name: username,
                email,
                phone,
                year,
                department,
                registerNumber,
                institutionName,
                state,
                city,
                pincode,
                password: passwordString,
                encryptedPassword: encrypt(passwordString),
                userCode: userCode,
                role: 'student',
                isActive: true
            });
            console.log('[DEBUG] Invite Password:', passwordString);
        }

        // 3. Create Enrollment
        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({ user: user._id, program: programId });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'User is already enrolled in this program' });
        }

        const enrollment = await Enrollment.create({
            user: user._id,
            program: programId,
            programType: program.type || 'Course', // Fallback to Course if undefined
            userCode: user.userCode,
            status: 'active', // Direct active for invites
            source: 'invite',
            enrolledAt: Date.now(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2) // Default 2 years validity
        });

        // 4. Send Notification (Email)
        const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:5173').replace(/\/+$|$/,'');
        const loginUrl = `${FRONTEND_URL}/login`;
        const emailSubject = `You’ve been invited to join your program at EdinzTech LMS`;
        const emailBody = `
            <h3>Hello ${user.name},</h3>
            <p>You have been added to the program: <strong>${program.title}</strong> (Code: ${program.code})</p>
            <p>Login here: <a href="${loginUrl}">${loginUrl}</a></p>
            ${isNewUser ? `
            <p><strong>Your Login Credentials:</strong></p>
            <p>Username: ${email}</p>
            <p>Password: ${passwordString}</p>
            <p><em>Please change your password after logging in.</em></p>
            ` : `<p>You can login with your existing credentials.</p>`}
        `;

        // Send Email (Soft Fail)
        let emailSent = false;
        try {
            // Check if email creds are real
            if (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@')) {
                const info = await sendEmail({
                    to: user.email,
                    subject: emailSubject,
                    html: emailBody
                });
                if (info) emailSent = true;
            } else {
                console.log("Skipping email send: Mock credentials detected.");
            }
        } catch (emailError) {
            console.error("Failed to send invite email (Non-fatal):", emailError);
        }

        // 5. Trigger Event
        eventBus.emit('USER_INVITED', { user, program, enrollment });

        res.status(201).json({
            success: true,
            message: emailSent ? 'Invitation sent successfully' : 'User enrolled (Email skipped - Config missing)',
            userId: user._id,
            programId
        });

    } catch (error) {
        console.error("Invite Error Details:", error);
        res.status(500).json({ message: 'Server Error inviting student: ' + error.message });
    }
};

const getEnrollments = async (req, res) => {
    try {
        console.log('[DEBUG] getEnrollments called'); // Debug Log
        const { type, programId, search, source } = req.query;

        let query = {};

        // Filter by Program Type
        if (type && type !== 'All') {
            query.programType = type;
        }

        // Filter by Specific Program
        if (programId) {
            query.programId = programId;
        }

        // Filter by Source (e.g. 'invite' vs 'web')
        if (source) {
            query.source = source;
        }

        console.log('[DEBUG] Query:', query); // Debug Log

        // Fetch Enrollments with populated data
        // We need deep population: user, program, and payment info
        const enrollments = await Enrollment.find(query)
            .populate('user', 'name email phone userCode year department registerNumber institutionName state city pincode')
            .populate('program', 'title type fee certificateTemplate templateType')
            .populate('paymentId', 'amount status')
            .sort({ createdAt: -1 });

        // DEBUG: Write to file to check what the server sees
        try {
            const fs = require('fs');
            const path = require('path');
            const debugLine = `[${new Date().toISOString()}] First Enrollment CertStatus: ${enrollments[0]?.certificateStatus} | ID: ${enrollments[0]?.certificateId}\n`;
            fs.writeFileSync(path.join(__dirname, '../debug_api_response.txt'), debugLine);
        } catch (e) { console.error(e); }

        console.log(`[DEBUG] Found ${enrollments.length} enrollments`); // Debug Log

        // Auto-fix: Check for missing userCodes and generate them on the fly
        // This ensures the table never shows N/A for valid users
        const updates = [];
        try {
            for (const enrollment of enrollments) {
                if (enrollment.user && !enrollment.user.userCode) {
                    // Generate code
                    if (!enrollment.user.userCode) {
                        // WARNING: saving a partial document (populated with select) can be risky.
                        // Skipping save for reliability during debug.
                        // enrollment.user.userCode = generateUserCode();
                        // updates.push(enrollment.user.save());
                        console.warn(`[DEBUG] Skipping auto-fix for user ${enrollment.user._id} due to partial doc risk.`);
                    }
                }
            }
            if (updates.length > 0) {
                await Promise.all(updates);
                console.log(`[Admin] Backfilled userCodes for ${updates.length} users in enrollment list.`);
            }
        } catch (autoFixError) {
            console.error('[DEBUG] Auto-fix failed:', autoFixError);
        }

        // Search Logic (Done in memory for simplicity/performance on populated fields)
        let results = enrollments;
        if (search) {
            const searchLower = search.toLowerCase();
            results = enrollments.filter(e =>
                (e.user?.name?.toLowerCase().includes(searchLower)) ||
                (e.user?.email?.toLowerCase().includes(searchLower)) ||
                (e.program?.title?.toLowerCase().includes(searchLower))
            );
        }

        // Format for frontend (and Auto-Fix Feedback Status)
        // Optimization: Fetch all feedbacks for these enrollments in one go to avoid N+1 queries
        // We only need to check for enrollments that are NOT marked as submitted yet
        const pendingEnrollments = results.filter(e => !e.isFeedbackSubmitted);

        let feedbackMap = new Set();
        let defaultFeedbackMap = new Set(); // userId-programId string

        if (pendingEnrollments.length > 0) {
            const FeedbackResponse = require('../models/FeedbackResponse');
            const DefaultFeedbackResponse = require('../models/DefaultFeedbackResponse');

            const enrollmentIds = pendingEnrollments.map(e => e._id);
            const userIds = pendingEnrollments.map(e => e.user?._id).filter(Boolean);
            const programIds = pendingEnrollments.map(e => e.program?._id).filter(Boolean);

            const [templateFeedbacks, defaultFeedbacks] = await Promise.all([
                FeedbackResponse.find({ enrollmentId: { $in: enrollmentIds } }).select('enrollmentId'),
                DefaultFeedbackResponse.find({ userId: { $in: userIds }, programId: { $in: programIds } }).select('userId programId')
            ]);

            templateFeedbacks.forEach(f => feedbackMap.add(f.enrollmentId.toString()));
            defaultFeedbacks.forEach(f => defaultFeedbackMap.add(`${f.userId}-${f.programId}`));

            // Apply fixes
            const fixUpdates = [];
            for (const enrollment of results) {
                if (!enrollment.isFeedbackSubmitted) {
                    const hasTemplate = feedbackMap.has(enrollment._id.toString());
                    const hasDefault = enrollment.user && enrollment.program && defaultFeedbackMap.has(`${enrollment.user._id}-${enrollment.program._id}`);

                    if (hasTemplate || hasDefault) {
                        enrollment.isFeedbackSubmitted = true;
                        fixUpdates.push(enrollment.save());
                    }
                }
            }

            if (fixUpdates.length > 0) {
                await Promise.all(fixUpdates);
                console.log(`[Admin] Auto-healed feedback status for ${fixUpdates.length} enrollments.`);
            }
        }

        const formatted = results.map(e => ({
            _id: e._id, // Enrollment ID
            userId: e.user?._id, // Student User ID for actions
            userCode: e.userCode || e.user?.userCode || 'N/A', // Denormalized > Populated
            studentName: e.user?.name || 'Unknown',
            email: e.user?.email || 'Unknown',
            phone: e.user?.phone || 'N/A',
            // Extended Profile Fields
            year: e.user?.year || '',
            department: e.user?.department || '',
            registerNumber: e.user?.registerNumber || '',
            institutionName: e.user?.institutionName || '',
            state: e.user?.state || '',
            city: e.user?.city || '',
            pincode: e.user?.pincode || '',

            programName: e.program?.title || 'Unknown',
            programType: e.programType || e.program?.type || 'N/A',
            amount: e.paymentId?.amount ? `₹${e.paymentId.amount}` : (e.program?.fee ? `₹${e.program.fee}` : 'Free'),
            status: e.paymentId?.status || 'Active', // Fallback
            certificateStatus: e.certificateStatus || 'NOT_PUBLISHED',
            isFeedbackSubmitted: e.isFeedbackSubmitted || false,
            certificateId: e.certificateId || '-',
            enrolledAt: e.enrolledAt,
            hasTemplate: !!e.program?.certificateTemplate
        }));

        res.json(formatted);

    } catch (error) {
        console.error("Get Enrollments Error:", error);
        res.status(500).json({ message: 'Failed to fetch enrollments' });
    }
};

const AccessLog = require('../models/AccessLog');
// const { decrypt } = require('../utils/encryption'); // Removed redundant import

const getStudentCredentials = async (req, res) => {
    try {
        const { studentId, adminPassword } = req.body;
        const adminUser = await User.findById(req.user._id).select('+password');

        if (!adminUser || !await adminUser.matchPassword(adminPassword)) {
            return res.status(403).json({ message: 'Invalid Admin Password' });
        }

        const student = await User.findById(studentId).select('+encryptedPassword');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        let decryptedPassword = 'Not Available';
        if (student.encryptedPassword) {
            try {
                decryptedPassword = decrypt(student.encryptedPassword);
            } catch (decErr) {
                console.error("Decryption Failed for user:", student._id, decErr);
                decryptedPassword = "Error: Decryption Failed";
            }
        }

        // Audit Log
        await AccessLog.create({
            adminId: req.user._id,
            targetUserId: student._id,
            action: 'VIEW_CREDENTIALS',
            ipAddress: req.ip,
            metadata: { userCode: student.userCode }
        });

        res.json({
            userCode: student.userCode || 'N/A',
            username: student.email,
            password: decryptedPassword
        });

    } catch (error) {
        console.error("Get Credentials Error:", error);
        res.status(500).json({ message: 'Failed to retrieve credentials' });
    }
};

// ... existing code ...

const resendCredentials = async (req, res) => {
    try {
        const { studentId, adminPassword } = req.body;
        const adminUser = await User.findById(req.user._id).select('+password');

        if (!adminUser || !await adminUser.matchPassword(adminPassword)) {
            return res.status(403).json({ message: 'Invalid Admin Password' });
        }

        const student = await User.findById(studentId).select('+encryptedPassword');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        let decryptedPassword = 'Not Available';
        if (student.encryptedPassword) {
            decryptedPassword = decrypt(student.encryptedPassword);
        }

        // Send Email
        const emailSent = await sendEmail({
            to: student.email,
            subject: 'Login Credentials (Resent) - EdinzTech',
            html: `<h3>Login Credentials</h3>
                   <p>Hello ${student.name},</p>
                   <p>Here are your login details as requested:</p>
                   <p><b>Username:</b> ${student.email}</p>
                   <p><b>Password:</b> ${decryptedPassword}</p>
                   <p><a href="${(process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:5173').replace(/\/+$|$/,'')}/login">Login Here</a></p>`
        });

        if (emailSent) {
            res.json({ message: 'Credentials sent successfully to ' + student.email });
        } else {
            res.status(500).json({ message: 'Failed to send email. Check server logs.' });
        }

    } catch (error) {
        console.error("Resend Credentials Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Export Enrollments to CSV
// @route   GET /api/admin/enrollments/export
// @access  Private/Admin
const exportEnrollments = async (req, res) => {
    try {
        const { type, programId, search } = req.query;
        let query = {};

        if (type && type !== 'All') query.programType = type;
        if (programId) query.programId = programId;

        // Fetch Enrollments
        const enrollments = await Enrollment.find(query)
            .populate('user', 'name email phone userCode year department registerNumber institutionName state city pincode')
            .populate('program', 'title type fee certificateTemplate templateType')
            .populate('paymentId', 'amount status')
            .sort({ createdAt: -1 });

        // Filter by search if needed (client side filter in getEnrollments, replicating here)
        let results = enrollments;
        if (search) {
            const searchLower = search.toLowerCase();
            results = enrollments.filter(e =>
                (e.user?.name?.toLowerCase().includes(searchLower)) ||
                (e.user?.email?.toLowerCase().includes(searchLower)) ||
                (e.program?.title?.toLowerCase().includes(searchLower))
            );
        }

        // Generate CSV
        let csv = 'Student Name,Email,Phone,Institution,Department,Year,Register No,City,State,Pincode,User Code,Program,Type,Amount,Status,Enrolled Date,Certificate Status,Certificate ID,Issued Date\n';

        results.forEach(e => {
            const row = [
                `"${e.user?.name || 'Unknown'}"`,
                `"${e.user?.email || 'Unknown'}"`,
                `"${e.user?.phone || 'N/A'}"`,
                `"${e.user?.institutionName || ''}"`,
                `"${e.user?.department || ''}"`,
                `"${e.user?.year || ''}"`,
                `"${e.user?.registerNumber || ''}"`,
                `"${e.user?.city || ''}"`,
                `"${e.user?.state || ''}"`,
                `"${e.user?.pincode || ''}"`,
                `"${e.userCode || e.user?.userCode || 'N/A'}"`,
                `"${e.program?.title || 'Unknown'}"`,
                e.program?.type || 'N/A',
                e.paymentId?.amount || e.program?.fee || '0',
                e.paymentId?.status || 'Active',
                e.enrolledAt ? new Date(e.enrolledAt).toISOString().split('T')[0] : '',
                `"${e.certificateStatus || 'NOT_PUBLISHED'}"`,
                `"${e.certificateId || ''}"`,
                e.certificateIssuedAt ? new Date(e.certificateIssuedAt).toISOString().split('T')[0] : ''
            ];
            csv += row.join(',') + '\n';
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('enrollments.csv');
        res.send(csv);

    } catch (error) {
        console.error("Export Enrollments Error:", error);
        res.status(500).json({ message: 'Failed to export enrollments' });
    }
};



const Certificate = require('../models/Certificate');
const Quiz = require('../models/Quiz');
// const FeedbackResponse = require('../models/FeedbackResponse'); // Assuming model exists, if not use fallback or generic count

const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();

        // 1. Program Queries
        // Fetch all active programs to compute derived status in memory or via basic date queries
        const allPrograms = await Program.find({ isArchived: false }).select('_id type startDate endDate');

        // Derived Metrics
        let activePrograms = 0;
        let upcomingPrograms = 0;
        let completedPrograms = 0;

        let coursesCount = 0;
        let workshopsCount = 0;
        let internshipsCount = 0;
        let internshipsActive = 0;
        let internshipsUpcoming = 0;
        let internshipsCompleted = 0;

        const activeProgramIds = [];

        allPrograms.forEach(p => {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            const isUpcoming = now < start;
            const isOngoing = now >= start && now <= end;
            const isCompleted = now > end;

            // Global Counts
            if (isUpcoming || isOngoing) {
                activePrograms++;
                activeProgramIds.push(p._id);
            } else if (isCompleted) {
                completedPrograms++;
            }
            if (isUpcoming) upcomingPrograms++;

            // Type Counts
            if (p.type === 'Course') coursesCount++;
            if (p.type === 'Workshop') workshopsCount++;
            if (p.type === 'Internship') {
                internshipsCount++;
                if (isUpcoming || isOngoing) internshipsActive++;
                if (isUpcoming) internshipsUpcoming++;
                if (isCompleted) internshipsCompleted++;
            }
        });

        // 2. Student Metrics
        const totalStudents = await User.countDocuments({ role: 'student' });
        const invitedStudents = await User.countDocuments({ role: 'student', lastLoginAt: null });

        // Enrolled: Unique students in any ACTIVE enrollment (not just ongoing programs)
        // This is "Active Students" based on enrollment status, matching the table view.
        const activeEnrolledIds = await Enrollment.distinct('user', {
            status: 'active'
        });
        const activeStudents = activeEnrolledIds.length;

        // Total Students Ever Enrolled (Lifetime) - derived or just use totalStudents?
        // User asked for "Total Internship Students" and "Active Internship Students"

        // Let's get "Total Enrolled" (Lifetime) vs "Active Enrolled" (Currently in ongoing program)
        // const totalEnrolledIds = await Enrollment.distinct('user', { status: 'active' }); 

        // Internship Specific Student Counts
        /*
        To get "Active Internship Students", we need enrollments where program is internship AND program is active.
        Since we have `activeProgramIds` (global), let's filter just internship IDs.
        */
        const activeInternshipIds = allPrograms
            .filter(p => p.type === 'Internship' && (new Date(p.startDate) <= new Date(p.endDate) && (new Date(p.startDate) > now || (new Date(p.startDate) <= now && new Date(p.endDate) >= now)))) // Simplified: just use the memory check IDs
            .map(p => p._id);

        // Re-calculate strictly from logic above
        const internshipIdsActive = allPrograms
            .filter(p => p.type === 'Internship' && (
                (now < new Date(p.startDate)) || // Upcoming is also "Active" in sense of not expired? No, usually "Active" means Learning.
                // Requirement says: "Active Internships (Ongoing + Upcoming)"
                // So Active Students = enrolled in Ongoing + Upcoming
                (now >= new Date(p.startDate) && now <= new Date(p.endDate)) ||
                (now < new Date(p.startDate))
            ))
            .map(p => p._id);

        const internshipStudentsActiveCount = (await Enrollment.distinct('user', {
            status: 'active',
            program: { $in: internshipIdsActive }
        })).length;

        const internshipIdsExpired = allPrograms
            .filter(p => p.type === 'Internship' && (now > new Date(p.endDate)))
            .map(p => p._id);

        // For "Expired Internship Students", this is tricky. 
        // A student is "expired" if they are ONLY in expired programs and NO active ones? 
        // Or just count of enrollments in expired programs?
        // User request: "Expired programs must reduce student counts dynamically" -> implies "Active Count" reduces.
        // So `internshipStudentsActiveCount` naturally handles this (it excludes expired programs).
        // Let's just return Active Internship Students for the dashboard metric.

        // 4. Engagement Metrics
        const quizzesCreated = await Quiz.countDocuments({});
        const pendingVerifications = await Certificate.countDocuments({ status: 'pending' });

        // Feedbacks
        let feedbacksReceived = 0;
        try {
            // feedbacksReceived = await FeedbackResponse.countDocuments({}); 
            feedbacksReceived = 0;
        } catch (e) {
            console.log('Feedback count skipped');
        }

        // 5. Build Response
        const stats = {
            students: {
                total: totalStudents,
                invited: invitedStudents,
                enrolled: activeStudents, // Strictly "Active Enrolled"
                internshipActive: internshipStudentsActiveCount
            },
            programs: {
                totalActive: activePrograms,
                courses: coursesCount,
                workshops: workshopsCount,
                internships: {
                    total: internshipsCount,
                    active: internshipsActive,
                    upcoming: internshipsUpcoming,
                    completed: internshipsCompleted
                }
            },
            engagement: {
                pendingVerifications,
                quizzesCreated,
                feedbacksReceived
            }
        };

        res.json(stats);

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};

const updateStudent = async (req, res) => {
    try {
        const studentId = req.params.id;
        const { name, email, phone, year, department, registerNumber, institutionName, state, city, pincode } = req.body;

        const user = await User.findById(studentId);

        if (!user) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (year) user.year = year;
        if (department) user.department = department;
        if (registerNumber) user.registerNumber = registerNumber;
        if (institutionName) user.institutionName = institutionName;
        if (state) user.state = state;
        if (city) user.city = city;
        if (pincode) user.pincode = pincode;

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            year: user.year,
            department: user.department,
            registerNumber: user.registerNumber,
            institutionName: user.institutionName,
            state: user.state,
            city: user.city,
            pincode: user.pincode
        });
    } catch (error) {
        console.error("Update Student Error:", error);
        res.status(500).json({ message: 'Failed to update student details' });
    }
};

const fs = require('fs');
const path = require('path');

// @desc    List all temporary files in certificate-service/temp
// @route   GET /api/admin/temp-files
// @access  Private/Admin
const listTempFiles = async (req, res) => {
    try {
        // Path to certificate-service/temp. Assumes sibling directory structure.
        const tempDir = path.join(__dirname, '../../certificate-service/temp');

        if (!fs.existsSync(tempDir)) {
            // Create it if it doesn't exist so we don't crash, but it should exist
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const files = fs.readdirSync(tempDir);
        const fileStats = [];

        for (const file of files) {
            // Only list PDFs to be safe, or all files? User asked for "all temporary files".
            // Ideally we filter for .pdf, .png (qr codes).
            if (file === '.gitignore') continue;

            const filePath = path.join(tempDir, file);
            try {
                const stats = fs.statSync(filePath);
                fileStats.push({
                    name: file,
                    size: (stats.size / 1024 / 1024).toFixed(2) + ' MB', // Convert to MB
                    sizeBytes: stats.size,
                    created: stats.birthtime
                });
            } catch (err) {
                // Ignore stat errors for locked files etc.
            }
        }

        // Sort by created date descending (newest first)
        fileStats.sort((a, b) => b.created - a.created);

        res.json({
            count: fileStats.length,
            totalSize: (fileStats.reduce((acc, curr) => acc + curr.sizeBytes, 0) / 1024 / 1024).toFixed(2) + ' MB',
            files: fileStats
        });

    } catch (error) {
        console.error("List Temp Files Error:", error);
        res.status(500).json({ message: 'Failed to list temporary files' });
    }
};

const deleteTempFiles = async (req, res) => {
    try {
        const { files } = req.body; // Array of filenames

        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ message: 'Invalid file list' });
        }

        const tempDir = path.join(__dirname, '../../certificate-service/temp');
        let deletedCount = 0;
        let failedCount = 0;

        for (const fileName of files) {
            // Security: Prevent directory traversal
            const safeName = path.basename(fileName);
            if (safeName !== fileName) continue; // Skip suspicious paths

            const filePath = path.join(tempDir, safeName);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                } catch (err) {
                    console.error(`Failed to delete ${fileName}:`, err);
                    failedCount++;
                }
            }
        }

        res.json({
            message: `Deleted ${deletedCount} files. ${failedCount > 0 ? failedCount + ' failed.' : ''}`,
            deletedCount
        });

    } catch (error) {
        console.error("Delete Temp Files Error:", error);
        res.status(500).json({ message: 'Failed to delete files' });
    }
};

// @desc    Reset Student Password (Admin Override)
// @route   POST /api/admin/credentials/reset
// @access  Private/Admin
const resetStudentPassword = async (req, res) => {
    try {
        const { studentId, newPassword, adminPassword } = req.body;
        const adminUser = await User.findById(req.user._id).select('+password');

        if (!adminUser || !await adminUser.matchPassword(adminPassword)) {
            return res.status(403).json({ message: 'Invalid Admin Password' });
        }

        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Update Password (hashed)
        student.password = newPassword;

        // Update Encrypted Password (for future admin view)
        student.encryptedPassword = encrypt(newPassword);

        // Security: Clear any reset tokens if present to avoid confusion
        student.resetPasswordTokenHash = undefined;
        student.resetPasswordExpires = undefined;

        await student.save();

        // Audit Log
        await AccessLog.create({
            adminId: req.user._id,
            targetUserId: student._id,
            action: 'RESET_PASSWORD',
            ipAddress: req.ip,
            metadata: { userCode: student.userCode }
        });

        // Optional: Send email notification
        try {
            await sendEmail({
                to: student.email,
                subject: 'Your Password Has Been Reset - EdinzTech',
                html: `<h3>Password Reset</h3>
                       <p>Hello ${student.name},</p>
                       <p>Your password has been reset by an administrator.</p>
                       <p><b>New Password:</b> ${newPassword}</p>
                       <p><a href="${(process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:5173').replace(/\/+$|$/,'')}/login">Login Here</a></p>`
            });
        } catch (emailErr) {
            console.error("Failed to send password reset email:", emailErr);
        }

        res.json({ message: 'Password reset successfully', newEncryptedPassword: student.encryptedPassword });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: 'Failed to reset password' });
    }
};

module.exports = {
    inviteStudent,
    getEnrollments,
    getStudentCredentials,
    resendCredentials,
    resetStudentPassword,
    exportEnrollments,
    getDashboardStats,
    updateStudent,
    listTempFiles,
    deleteTempFiles
};
