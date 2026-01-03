const asyncHandler = require('express-async-handler');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const FeedbackResponse = require('../models/FeedbackResponse');
const Program = require('../models/Program');
const User = require('../models/User'); // Ensure User model is loaded
const InspireRegistry = require('../models/InspireRegistry');
const FeedbackRegistry = require('../models/FeedbackRegistry'); // Added
const Course = require('../models/Course'); // Added Course model
const { normalizeCertId } = require('../utils/normalization');

// @desc    Publish certificates for a program
// @route   POST /api/admin/programs/:id/publish-certificates
// @access  Private/Admin
const axios = require('axios'); // Add axios
const QRCode = require('qrcode'); // New Architecture


// @desc    Publish certificates for a program (Trigger Service)
// @route   POST /api/admin/programs/:id/publish-certificates
// Helper function to generate and publish a single certificate
const generateCertificateForEnrollment = async (enrollment, program, user, force) => {
    const CERT_SERVICE_URL = process.env.CERT_SERVICE_URL || 'http://localhost:5002/api/generate';
    const CALLBACK_URL = process.env.CALLBACK_BASE_URL
        ? `${process.env.CALLBACK_BASE_URL}/api/webhooks/certificate-status`
        : `http://127.0.0.1:${process.env.PORT || 5000}/api/webhooks/certificate-status`;

    // A. Generate ID (Standard Format: CERT-<CODE>-<YYYY>-<RANDOM>)
    // Use existing ID if already published (and forced), otherwise generate new
    let certificateId = enrollment.certificateId;
    if (!certificateId || force) {
        const year = new Date().getFullYear();
        const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6 digit
        const code = program.code || 'PROG';
        certificateId = `CERT-${code}-${year}-${randomSuffix}`;
    }

    // B. Generate QR Data (Direct Verify Link)
    const domain = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${domain}/verify?certificateId=${certificateId}`;
    const qrCodeImage = await QRCode.toDataURL(verifyUrl);

    // C. CALL SERVICE SYNCHRONOUSLY
    await axios.post(CERT_SERVICE_URL, {
        studentData: {
            name: user.name,
            email: user.email,
            id: user._id,
            registerNumber: user.registerNumber,
            year: user.year,
            institutionName: user.institutionName,
            programName: program.title
        },
        courseData: {
            title: program.title,
            id: program._id
        },
        certificateId: certificateId,
        templateId: program.templateType || program.certificateTemplate || 'default',
        templateUrl: program.certificateTemplate,
        qrCode: qrCodeImage,
        callbackUrl: CALLBACK_URL,
        type: 'certificate'
    });

    // D. COMMIT TO DB
    enrollment.certificateStatus = 'PUBLISHED';
    enrollment.certificateId = certificateId;
    if (!enrollment.certificateIssuedAt) {
        enrollment.certificateIssuedAt = new Date();
    }
    await enrollment.save();

    // E. UPSERT CERTIFICATE DOCUMENT (Fix for Verification)
    // Essential for "Verify" page and "My Certificates"
    await Certificate.findOneAndUpdate(
        { certificateId: certificateId },
        {
            user: user._id,
            program: program._id, // Use program._id from the populated program object
            certificateId: certificateId,
            status: 'sent',
            courseName: program.title,
            qrCode: qrCodeImage,
            issuedAt: enrollment.certificateIssuedAt,
            metadata: {
                generatedAt: new Date(),
                email: user.email,
                fileUrl: `files/${certificateId}.pdf`
            }
        },
        { upsert: true, new: true }
    );

    return {
        certificateId: certificateId,
        issuedAt: enrollment.certificateIssuedAt
    };
};


// @desc    Publish certificates for a program (Trigger Service)
// @route   POST /api/admin/programs/:id/publish-certificates
// @access  Private/Admin
const publishCertificates = asyncHandler(async (req, res) => {
    const programId = req.params.id;
    const force = req.query.force === 'true';

    const program = await Program.findById(programId);
    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    const enrollments = await Enrollment.find({ program: programId }) // Changed programId to program
        .populate('user')
        .populate('program'); // Changed programId to program

    const alreadyPublished = [];
    const newlyPublished = [];
    const pendingFeedback = [];
    const errors = [];

    // 1. Fetch Feedback Status Map (Optimization)
    // Actually, we use enrollment.isFeedbackSubmitted which is denormalized.

    // 2. Determine Template
    const templateId = program.templateType || program.certificateTemplate || 'default';
    if (!templateId) {
        res.status(400);
        throw new Error('Certificate Template not configured for Program');
    }

    // 3. Process Each Enrollment (ATOMICALLY)
    for (const enrollment of enrollments) {
        const user = enrollment.user;
        if (!user) continue;

        // CHECK: If already published and NOT forced -> Add to alreadyPublished list
        if (enrollment.certificateStatus === 'PUBLISHED' && !force) {
            alreadyPublished.push({
                enrollmentId: enrollment._id,
                studentName: user.name,
                email: user.email,
                certificateId: enrollment.certificateId,
                issuedAt: enrollment.certificateIssuedAt
            });
            continue;
        }

        // FEEDBACK GATE
        // If feedback is required AND not submitted AND not forced
        if (program.isFeedbackEnabled && !enrollment.isFeedbackSubmitted && !force) {
            enrollment.certificateStatus = 'PENDING_FEEDBACK';
            await enrollment.save();
            pendingFeedback.push({
                email: user.email,
                name: user.name
            });
            continue;
        }

        try {
            const result = await generateCertificateForEnrollment(enrollment, program, user, force);
            newlyPublished.push({
                studentName: user.name,
                email: user.email,
                certificateId: result.certificateId,
                issuedAt: result.issuedAt
            });
        } catch (error) {
            console.error(`Failed to publish for ${user.email}:`, error.message);
            errors.push(`${user.email}: ${error.message}`);
        }
    }

    res.json({
        success: true,
        message: `Processed. New: ${newlyPublished.length}, Existing: ${alreadyPublished.length}, Pending Feedback: ${pendingFeedback.length}, Failed: ${errors.length}`,
        newlyPublished,
        alreadyPublished,
        pendingFeedback,
        errors
    });
});

// @desc    Get my certificates
// @route   GET /api/certificates/me
// @access  Private
const getMyCertificates = asyncHandler(async (req, res) => {
    const certificates = await Certificate.find({ user: req.user._id })
        .populate('program', 'title type');
    res.json(certificates);
});



// @desc    Resolve Legacy QR Code to ISS ID
// @route   POST /api/certificates/resolve
// @access  Public
const resolveLegacyQR = asyncHandler(async (req, res) => {
    let { qrInput } = req.body;

    if (!qrInput) {
        res.status(400);
        throw new Error('QR Input is required');
    }

    // 1. Clean Input (Handle URLs)
    let identifier = qrInput.trim();
    try {
        if (identifier.startsWith('http')) {
            const url = new URL(identifier);
            if (url.searchParams.has('id')) {
                identifier = url.searchParams.get('id');
            } else {
                identifier = url.pathname.split('/').pop();
            }
        }
    } catch (e) {
        // Not a URL
    }

    // Normalize
    const normalizedIdentifier = normalizeCertId(identifier);

    // 2. Direct ISS Check
    if (identifier.startsWith('ISS') || (normalizedIdentifier && normalizedIdentifier.startsWith('ISS'))) {
        // If it looks like an ISS ID (even with trailing chars), valid.
        return res.json({ certificateId: normalizedIdentifier });
    }

    // 3. Feedback Registry Lookup (Priority: InspireId)
    // Note: Schema might miss legacyId if user reverted it. We check inspireId at least.
    const feedbackMatch = await FeedbackRegistry.findOne({
        $or: [
            { inspireId: normalizedIdentifier },
            // Safe lookup: checks if legacyId matches if it exists in schema/doc
            { legacyId: identifier }
        ]
    });

    if (feedbackMatch) {
        return res.json({ certificateId: feedbackMatch.certificateId });
    }

    // 4. Legacy Cert Object Lookup
    const legacyCertMatch = await Certificate.findOne({ legacyObjectId: identifier });
    if (legacyCertMatch) {
        return res.json({ certificateId: legacyCertMatch.certificateId });
    }

    // Default: Return normalized input
    return res.json({ certificateId: normalizedIdentifier });
});

// @desc    Issue New Certificate (EDZ- Format)
// @route   POST /api/certificates/issue
// @access  Private (Admin)
const issueCertificate = asyncHandler(async (req, res) => {
    const { userId, programId, issueDate, duration } = req.body;

    // 1. Validate Input
    if (!userId || !programId) {
        res.status(400);
        throw new Error('User ID and Program ID are required');
    }

    // 2. Fetch Data
    const user = await User.findById(userId);
    const program = await Program.findById(programId);

    if (!user || !program) {
        res.status(404);
        throw new Error('User or Program not found');
    }

    // 3. Generate New ID (EDZ-CERT-YYYY-XXXX)
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    const certificateId = `EDZ-CERT-${year}-${user._id.toString().slice(-4)}${randomSuffix}`;

    // 4. Generate QR Code (CERT:<ID>)
    const qrData = `CERT:${certificateId}`;
    const qrCodeImage = await QRCode.toDataURL(qrData);

    // 5. Create Certificate Record
    const certificate = await Certificate.create({
        certificateId,
        user: userId,
        program: programId,
        courseName: program.title, // Snapshot
        qrCode: qrCodeImage, // Store Base64
        timeline: {
            startDate: program.startDate,
            endDate: program.endDate,
            duration: duration || program.duration,
        },
        verification: {
            status: 'valid',
            source: 'new'
        },
        audit: {
            migratedAt: issueDate || Date.now()
        }
    });

    res.status(201).json(certificate);
});

// @desc    Verify New Certificate (Strict EDZ- Flow)
// @route   GET /api/new-certificates/verify/:certificateId
// @access  Public
const verifyNewCertificate = asyncHandler(async (req, res) => {
    const { certificateId } = req.params;

    // 1. Strict ID Check
    // 1. Strict ID Check
    if (!certificateId.startsWith('EDZ-') && !certificateId.startsWith('CERT-')) {
        res.status(400);
        throw new Error('Invalid Certificate Format. This endpoint supports new EDZ/CERT certificates only.');
    }

    // 2. Find Certificate
    const certificate = await Certificate.findOne({ certificateId })
        .populate('user', 'name email institutionName')
        .populate('program', 'title');

    if (!certificate) {
        res.status(404);
        throw new Error('Certificate Not Found');
    }

    // 3. Return Clean Payload
    const response = {
        certificateId: certificate.certificateId,
        studentName: certificate.user?.name || 'Unknown Student',
        email: certificate.user?.email, // Sensitive? Requirements asked for it.
        institution: certificate.user?.institutionName,
        programName: certificate.program?.title || certificate.courseName,
        enrolledDate: certificate.timeline?.startDate,
        issueDate: certificate.audit?.migratedAt, // or any specific issue date field if added
        duration: certificate.timeline?.duration,
        status: certificate.verification.status,
        issuedBy: "EdinzTech",
        valid: certificate.verification.status === 'valid' // Frontend expects this boolean
    };

    res.json(response);
});

// @desc    Verify Certificate (Unified: Enrollment First -> Legacy)
// @route   GET /api/certificates/verify?certificateId=X OR /:code
// @access  Public
const verifyCertificate = asyncHandler(async (req, res) => {
    // 1. Resolve ID (Query or Param)
    const certificateId = req.query.certificateId || req.query.id || req.params.code;

    if (!certificateId) {
        res.status(400);
        throw new Error('Certificate ID is required');
    }

    // 2. PRIMARY CHECK: Enrollment Table (The Source of Truth)
    const enrollment = await Enrollment.findOne({
        certificateId: certificateId
    }).populate('user', 'name email').populate('program', 'title startDate endDate duration');

    if (enrollment) {
        // Valid Mandatory Certificate
        return res.json({
            status: 'VALID',
            certificateId: enrollment.certificateId,
            studentName: enrollment.user?.name || enrollment.studentName,
            programName: enrollment.program?.title || enrollment.programName,
            enrollmentDate: enrollment.enrolledAt,
            certificateIssuedDate: enrollment.certificateIssuedAt || enrollment.updatedAt,
            duration: enrollment.program?.duration || 'N/A',
            certificateStatus: enrollment.certificateStatus,
            courseStartDate: enrollment.program?.startDate,
            courseEndDate: enrollment.program?.endDate
        });
    }

    // 3. SECONDARY CHECK: Legacy Certificate Collection
    const legacyCert = await Certificate.findOne({
        $or: [
            { certificateId: certificateId },
            { 'verification.code': certificateId } // Legacy code field
        ]
    }).populate('user', 'name').populate('program', 'title');

    if (legacyCert) {
        return res.json({
            status: legacyCert.verification?.status === 'valid' ? 'VALID' : 'INVALID',
            certificateId: legacyCert.certificateId,
            studentName: legacyCert.user?.name,
            programName: legacyCert.courseName || legacyCert.program?.title,
            enrollmentDate: legacyCert.timeline?.startDate,
            certificateIssuedDate: legacyCert.createdAt,
            duration: legacyCert.timeline?.duration,
            info: "Legacy Certificate"
        });
    }

    // 4. Not Found
    res.status(404).json({
        status: 'INVALID',
        message: 'Certificate not found or invalid.'
    });
});

// @desc    Publish Offer Letters for a program
// @route   POST /api/admin/programs/:id/publish-offer-letters
// @access  Private/Admin
const publishOfferLetters = asyncHandler(async (req, res) => {
    const programId = req.params.id;
    const CERT_SERVICE_URL = process.env.CERT_SERVICE_URL || 'http://localhost:5002/api/generate';
    const CALLBACK_URL = process.env.CALLBACK_BASE_URL
        ? `${process.env.CALLBACK_BASE_URL}/api/webhooks/certificate-status`
        : `http://127.0.0.1:${process.env.PORT || 5000}/api/webhooks/certificate-status`;

    // 1. Verify Program
    const program = await Program.findById(programId);
    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    // 2. Find Active/Completed Enrollments
    const enrollments = await Enrollment.find({
        program: programId,
        status: { $in: ['active', 'completed', 'invited', 'pending'] }
    }).populate('user', 'name email registerNumber year institutionName department pincode city state');

    if (enrollments.length === 0) {
        res.status(400);
        throw new Error('No enrolled students found for this program');
    }

    let triggeredCount = 0;
    const failures = [];

    // 3. Trigger Service for Each
    for (const enrollment of enrollments) {
        const user = enrollment.user;
        if (!user) {
            console.log(`[DEBUG] Skipping enrollment ${enrollment._id}: No User`);
            continue;
        }

        // Check availability (Idempotency)
        const exists = await Certificate.findOne({
            user: user._id,
            program: programId,
            certificateId: { $regex: /^(OFFER|ACCEPT)-/ }
        });

        console.log(`[DEBUG] Processing ${user.email} | Exists: ${!!exists} | Status: ${exists?.status} | Force: ${req.query.force}`);

        // REPROCESS CONDITION:
        if (!exists || exists.status === 'failed' || exists.status === 'pending' || req.query.force === 'true') {
            // Determine Type and Prefix based on Program Type
            const isProject = (program.type || '').toLowerCase() === 'project';
            const prefix = isProject ? 'ACCEPT-' : 'OFFER-';
            const letterType = isProject ? 'acceptance-letter' : 'offer-letter';

            const certificateId = `${prefix}${program.code || 'PROG'}-${user._id.toString().slice(-4)}-${Date.now().toString().slice(-4)}`;

            let certDoc;
            if (!exists) {
                certDoc = await Certificate.create({
                    user: user._id,
                    program: programId,
                    certificateId: certificateId,
                    status: 'pending',
                    metadata: { type: letterType },
                    courseName: program.title,
                    verification: { status: 'valid', source: 'new' }
                });
            } else {
                certDoc = exists;
                certDoc.status = 'pending';
                certDoc.error = undefined;
                await certDoc.save();
            }

            // Sync with Enrollment Source of Truth
            enrollment.offerLetterStatus = 'ISSUED';
            await enrollment.save();

            // Format Program Start Date for the Letter
            let formattedStartDate = new Date().toLocaleDateString('en-GB'); // Fallback to today
            if (program.startDate) {
                const d = new Date(program.startDate);
                if (!isNaN(d.getTime())) {
                    const day = d.getDate().toString().padStart(2, '0');
                    const month = (d.getMonth() + 1).toString().padStart(2, '0');
                    const year = d.getFullYear();
                    formattedStartDate = `${day}-${month}-${year}`;
                }
            }

            // Call Microservice
            console.log(`[DEBUG] Triggering Service with Callback: ${CALLBACK_URL}`);

            try {
                await axios.post(CERT_SERVICE_URL, {
                    type: letterType, // 'offer-letter' or 'acceptance-letter'
                    date: formattedStartDate, // Explicit date for letter
                    issueDate: formattedStartDate, // Alias
                    studentData: {
                        name: user.name,
                        email: user.email,
                        id: user._id,
                        registerNumber: user.registerNumber || '',
                        year: user.year || '',
                        institutionName: user.institutionName || '',
                        department: user.department || '',
                        pincode: user.pincode || '',
                        city: user.city || '',
                        state: user.state || ''
                    },
                    courseData: {
                        title: program.title,
                        id: program._id,
                        startDate: program.startDate,
                        endDate: program.endDate
                    },
                    certificateId: certDoc.certificateId,
                    callbackUrl: CALLBACK_URL,
                    templateId: program.templateType || letterType,
                    templateUrl: program.offerLetterTemplate // Reusing this field for both
                });
                triggeredCount++;
            } catch (err) {
                const msg = err.response?.data?.message || err.message;
                console.error(`Failed to trigger offer letter service for ${user.email}:`, msg);
                certDoc.status = 'failed';
                certDoc.error = `Trigger Failed: ${msg}`;
                await certDoc.save();
                failures.push(`${user.email}: ${msg}`);
            }
        }
    }

    res.json({
        success: true,
        message: `Offer Letter generation triggered. Requests sent: ${triggeredCount}`,
        triggeredCount,
        failures
    });
});



// @desc    Regenerate and Resend Certificate (Reuse ID)
// @route   POST /api/certificates/regenerate/:enrollmentId
// @access  Private/Admin
const regenerateCertificate = asyncHandler(async (req, res) => {
    const enrollmentId = req.params.enrollmentId; // Expecting enrollment ID
    const CERT_SERVICE_URL = process.env.CERT_SERVICE_URL || 'http://localhost:5002/api/generate';

    const enrollment = await Enrollment.findById(enrollmentId)
        .populate('user', 'name email registerNumber year institutionName')
        .populate('program', 'title code certificateTemplate');

    if (!enrollment) {
        res.status(404);
        throw new Error('Enrollment not found');
    }

    if (enrollment.certificateStatus !== 'PUBLISHED' || !enrollment.certificateId) {
        res.status(400);
        throw new Error('Certificate not yet published. Use Publish first.');
    }

    const user = enrollment.user;
    const program = enrollment.program;

    // DEBUG LOGGING
    const fs = require('fs');
    const path = require('path');
    const debugPath = path.join(__dirname, '../debug_regen_error.txt');
    const logDebug = (msg) => {
        try { fs.appendFileSync(debugPath, `[${new Date().toISOString()}] ${msg}\n`); } catch (e) { }
    };

    try {
        console.log(`[Regen] Starting for Enrollment: ${enrollmentId}`);
        logDebug(`Starting regeneration for Enrollment: ${enrollmentId}`);

        // Reuse Existing ID
        const certificateId = enrollment.certificateId;
        logDebug(`Certificate ID: ${certificateId}`);

        // Generate QR Data
        const domain = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyUrl = `${domain}/verify?certificateId=${certificateId}`;
        const qrCodeImage = await QRCode.toDataURL(verifyUrl);
        logDebug(`QR Generated.`);

        // Call Service
        const serviceUrl = process.env.CERT_SERVICE_URL || 'http://localhost:5002/api/generate';
        console.log(`[Regen] Calling Service at: ${serviceUrl}`);
        logDebug(`Calling Service at: ${serviceUrl}`);

        await axios.post(serviceUrl, {
            studentData: {
                name: user.name,
                email: user.email,
                id: user._id,
                registerNumber: user.registerNumber,
                year: user.year,
                institutionName: user.institutionName,
                programName: program.title
            },
            courseData: {
                title: program.title,
                id: program._id
            },
            certificateId: certificateId,
            templateId: program.templateType || program.certificateTemplate || 'default',
            templateUrl: program.certificateTemplate,
            qrCode: qrCodeImage,
            callbackUrl: 'http://ignore.me',
            type: 'certificate'
        });
        console.log(`[Regen] Service Call Success`);
        logDebug(`Service Call Success.`);

        res.json({
            success: true,
            message: `Certificate re-generated and sent to ${user.email}`,
            certificateId: certificateId
        });

    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[Regen ERROR] ${errorMsg}`, error);
        logDebug(`ERROR: ${errorMsg}`);
        res.status(500);
        throw new Error(error.response?.data?.message || 'Failed to regenerate certificate');
    }
});



// @desc    Publish a single certificate for an enrollment
// @route   POST /api/certificates/publish/:enrollmentId
// @access  Private/Admin
const publishSingleCertificate = asyncHandler(async (req, res) => {
    const enrollmentId = req.params.enrollmentId;
    const force = req.query.force === 'true';

    const enrollment = await Enrollment.findById(enrollmentId)
        .populate('user')
        .populate('program');

    if (!enrollment) {
        res.status(404);
        throw new Error('Enrollment not found');
    }

    const program = enrollment.program;
    const user = enrollment.user;

    // Check Gating
    // If feedback enabled AND feedback not submitted AND not forced
    if (program.isFeedbackEnabled && !enrollment.isFeedbackSubmitted && !force) {
        res.status(400);
        throw new Error('Feedback is pending for this student. Cannot publish certificate.');
    }

    // Generate
    try {
        const result = await generateCertificateForEnrollment(enrollment, program, user, force);
        res.json({
            success: true,
            message: 'Certificate published successfully',
            certificateId: result.certificateId
        });
    } catch (error) {
        console.error(`Failed to publish single cert for ${user.email}:`, error.message);
        res.status(500);
        throw new Error(error.response?.data?.message || 'Failed to generate certificate');
    }
});

module.exports = {
    publishCertificates,
    publishOfferLetters,
    getMyCertificates,
    verifyCertificate,
    issueCertificate,
    resolveLegacyQR,
    verifyNewCertificate,
    regenerateCertificate,
    generateCertificateForEnrollment,
    publishSingleCertificate
};
