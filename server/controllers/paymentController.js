const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Program = require('../models/Program');
const { createOrUpdateEnrollment } = require('../services/enrollmentService');
const { sendEmail } = require('../services/emailService');
const { getEnrollmentEmailTemplate } = require('../utils/emailTemplates');
const whatsappService = require('../services/whatsappService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const fs = require('fs');
const path = require('path');
const { encrypt, decrypt, generateUserCode } = require('../utils/encryption');

// ... (imports)

// @desc    Create Razorpay Order (Guest/DB-Driven)
// @route   POST /api/payments/create-order
// @access  Public
// @desc    Create Razorpay Order (Guest/DB-Driven)
// @route   POST /api/payments/create-order
// @access  Public
const createOrder = asyncHandler(async (req, res) => {
    try {
        const { programId, name, email, phone, programType, year, department, registerNumber, institutionName, state, city, pincode } = req.body;
        // NOTE: 'amount' from frontend is IGNORED for security.

        if (!name || !email || !phone) {
            res.status(400);
            throw new Error('Please provide name, email, and phone');
        }

        console.log(`[CreateOrder] Request for Program: ${programId}, User: ${email}`);

        const program = await Program.findById(programId);
        if (!program) {
            res.status(404);
            throw new Error('Program not found');
        }

        // --- DUPLICATE CHECK START ---
        // 1. Check if user already exists
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            // 2. Check if already enrolled
            // Note: Use flexible query to catch active enrollments
            const existingEnrollment = await require('../models/Enrollment').findOne({
                user: existingUser._id,
                program: programId,
                status: 'active'
            });

            if (existingEnrollment) {
                console.log(`[CreateOrder] Blocked duplicate for ${email} in ${programId}`);
                res.status(400);
                // Exact message requested by user
                throw new Error('This email ID is already registered for this particular program. You can\'t buy the course. Try to login.');
            }
        }
        // --- DUPLICATE CHECK END ---

        if (program.paymentMode !== 'Paid' || program.fee === 0) {
            // It's a free program. We should enroll them directly.
            let user = existingUser;
            let isNewUser = false;
            let autoPassword = '';

            if (!user) {
                isNewUser = true;
                autoPassword = crypto.randomBytes(8).toString('hex');
                user = await User.create({
                    name, email, phone, year, department, registerNumber, institutionName, state, city, pincode,
                    password: autoPassword, encryptedPassword: encrypt(autoPassword), userCode: generateUserCode(), role: 'student', isActive: true
                });
            } else if (!user.userCode) {
                user.userCode = generateUserCode();
                await user.save();
            }

            // Create Free Payment Record
            const newPayment = await Payment.create({
                razorpayOrderId: `free_order_${Date.now()}`,
                razorpayPaymentId: `free_${crypto.randomBytes(4).toString('hex')}`,
                user: user._id, program: programId, programType: programType || program.type, amount: 0, status: 'captured'
            });

            // Enroll
            const EnrollmentModel = require('../models/Enrollment');
            await EnrollmentModel.findOneAndUpdate(
                { user: user._id, program: programId },
                { user: user._id, program: programId, programType: programType || program.type, userCode: user.userCode, paymentId: newPayment._id, status: 'active', source: 'free', enrolledAt: new Date(), validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
                { upsert: true, new: true }
            );

            // Send Email
            // Send Email
            const welcomeAddon = program.welcomeEmailContent || null;
            const programCode = program.code || 'N/A';

            const emailHtml = getEnrollmentEmailTemplate({
                isNewUser,
                name: user.name,
                email: user.email,
                password: isNewUser ? autoPassword : 'Not Available (Login with existing password)',
                programType: programType || program.type,
                programCode: programCode,
                loginUrl: `${process.env.FRONTEND_URL}/login`,
                welcomeAddon
            });

            await sendEmail({
                to: user.email,
                subject: isNewUser ? 'Welcome to EdinzTech - Login Credentials' : 'Enrollment Confirmed - EdinzTech',
                html: emailHtml
            });

            try { await whatsappService.sendTemplate(user, program, 'onEnrolled'); } catch (e) { }

            return res.json({ id: 'free', amount: 0, isFree: true, message: 'Successfully enrolled for free' });
        }

        const fee = program.fee;
        if (!fee || fee <= 0) {
            res.status(400);
            throw new Error('Invalid program fee');
        }

        const options = {
            amount: Math.round(fee * 100), // Convert to paise
            currency: 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-10)}_${Math.floor(Math.random() * 10000)}`, // Max 40 chars
            notes: {
                programId: program._id.toString(),
                programType: programType || program.type, // Fallback to DB type
                name,
                email,
                phone,
                year,
                department,
                registerNumber,
                institutionName,
                state,
                city,
                pincode
            }
        };

        console.log(`[CreateOrder] Options prepared:`, JSON.stringify(options));

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        const logMsg = `[Error Details] ${new Date().toISOString()}
Type: ${typeof error}
Message: ${error.message}
Stack: ${error.stack}
JSON: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}
`;
        fs.appendFileSync(path.join(__dirname, '../error.log'), logMsg);
        console.error(error);

        // Ensure 400 passes through to frontend
        if (res.statusCode === 200) res.status(500);
        throw error;
    }
});

// @desc    Free Enrollment for Price 0 Programs
// @route   POST /api/payments/enroll-free
// @access  Private
const enrollFree = asyncHandler(async (req, res) => {
    const { programId } = req.body;
    const userId = req.user._id;

    const program = await Program.findById(programId);
    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    // --- DUPLICATE CHECK START ---
    const existingEnrollment = await require('../models/Enrollment').findOne({
        user: userId,
        program: programId,
        status: 'active'
    });

    if (existingEnrollment) {
        res.status(400);
        throw new Error('You are already enrolled in this program.');
    }
    // --- DUPLICATE CHECK END ---

    if (program.fee > 0 && program.paymentMode !== 'Free') {
        res.status(400);
        throw new Error('This program is not free');
    }

    // Create a "free" payment record for consistency
    const payment = await Payment.create({
        user: userId,
        program: programId,
        amount: 0,
        status: 'captured',
        razorpayPaymentId: `free_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        razorpayOrderId: `free_order_${Date.now()}`
    });

    await createOrUpdateEnrollment({
        userId,
        programId,
        source: 'free',
        paymentId: payment._id
    });

    const welcomeAddon = program.welcomeEmailContent ? `<br><br><div style="background:#f9f9f9;padding:15px;border-left:4px solid #4f46e5;margin-top:20px;"><strong>Additional Information:</strong><br>${program.welcomeEmailContent.replace(/\n/g, '<br>')}</div>` : '';

    await sendEmail({
        email: req.user.email,
        subject: 'Enrollment Confirmed - EdinzTech',
        html: `Hi ${req.user.name}, you have been successfully enrolled in ${program.title} (Code: ${program.code}) for free.${welcomeAddon}`
    });

    res.json({ status: 'success', message: 'Enrolled successfully' });
});

// @desc    Handle Razorpay Webhook
// @route   POST /api/payments/webhook
// @access  Public (Webhook)
// @desc    Handle Razorpay Webhook
// @route   POST /api/payments/webhook
// @access  Public (Webhook)
const handleWebhook = asyncHandler(async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // File Logging Helper
    const logToFile = (msg) => {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${msg}\n`;
        try {
            fs.appendFileSync(path.join(__dirname, '../debug_webhook.log'), logLine);
            console.log(msg);
        } catch (e) {
            console.error("Failed to write to debug log", e);
        }
    };

    logToFile("------------------------------------------------");
    logToFile("[Webhook Debug] Hit Received");
    logToFile(`[Webhook Debug] Headers: ${JSON.stringify(req.headers)}`);
    logToFile(`[Webhook Debug] Raw Body Type: ${typeof req.rawBody}`);
    logToFile(`[Webhook Debug] Raw Body exists? ${!!req.rawBody}`);
    if (req.rawBody) logToFile(`[Webhook Debug] Body Length: ${req.rawBody.length}`);
    logToFile(`[Webhook Debug] Secret exists? ${!!secret}`);

    // Validate signature using RAW BODY
    const shasum = crypto.createHmac('sha256', secret);
    // Safety check for rawBody
    if (!req.rawBody) {
        console.error("[Webhook Debug] CRITICAL: req.rawBody is missing! Signature verification will fail.");
        return res.status(400).json({ error: "Raw body missing" });
    }

    shasum.update(req.rawBody); // Critical: Use raw buffer
    const digest = shasum.digest('hex');

    console.log(`[Webhook Debug] Computed Digest: ${digest}`);
    console.log(`[Webhook Debug] Received Signature: ${req.headers['x-razorpay-signature']}`);

    if (digest === req.headers['x-razorpay-signature']) {
        console.log("[Webhook Debug] Signature MATCHED");
        const event = req.body.event;
        const payload = req.body.payload;

        if (event === 'payment.captured') {
            const paymentEntity = payload.payment.entity;
            const userEmail = notes.email || email;
            const userPhone = notes.phone || contact;
            const userName = notes.name || 'Student';
            const { year, department, registerNumber, institutionName, state, city, pincode } = notes;

            const programId = notes.programId;
            const programType = notes.programType || 'Course'; // Default fallback

            // Check if user exists (Idempotent creation)
            if (userEmail && programId) {
                let user = await User.findOne({ email: userEmail });
                let isNewUser = false;
                let autoPassword = '';

                if (!user) {
                    isNewUser = true;
                    autoPassword = crypto.randomBytes(8).toString('hex'); // Stronger password

                    const userCode = generateUserCode();
                    try {
                        user = await User.create({
                            name: userName,
                            email: userEmail,
                            phone: userPhone,
                            year,
                            department,
                            registerNumber,
                            institutionName,
                            state,
                            city,
                            pincode,
                            password: autoPassword,
                            encryptedPassword: encrypt(autoPassword),
                            userCode: userCode,
                            role: 'student',
                            isActive: true
                        });
                        console.log(`[Webhook] Created new user: ${userEmail} (${userCode})`);
                    } catch (err) {
                        if (err.code === 11000) {
                            console.log(`[Webhook] User race condition caught for ${userEmail}`);
                            // Start with selecting encryptedPassword so we can send it in email if needed
                            user = await User.findOne({ email: userEmail }).select('+encryptedPassword');
                            if (!user) throw err;
                            isNewUser = false;
                        } else {
                            throw err; // Re-throw other errors
                        }
                    }
                } else {
                    console.log(`[Webhook] Found existing user: ${userEmail}`);
                    // Backfill userCode if missing (Migration for old users)
                    if (!user.userCode) {
                        user.userCode = generateUserCode();
                        await user.save();
                        console.log(`[Webhook] Backfilled userCode for: ${userEmail}`);
                    }
                }

                // 2. Create Payment Record (Idempotency Check)
                const existingPayment = await Payment.findOne({ razorpayPaymentId: paymentId });

                if (!existingPayment) {
                    try {
                        const newPayment = await Payment.create({
                            razorpayOrderId: order_id,
                            razorpayPaymentId: paymentId,
                            user: user._id,
                            program: programId,
                            programType: programType,
                            amount: amount / 100,
                            status: 'captured'
                        });
                        console.log(`[Webhook] Recorded payment: ${newPayment._id}`);
                    } catch (err) {
                        if (err.code === 11000) {
                            console.log(`[Webhook] Payment race condition caught for ${paymentId}`);
                            // Proceed as if existing
                        } else {
                            throw err;
                        }
                    }

                    // 3. Enroll User (Explicit Logic)
                    const enrollment = await require('../models/Enrollment').findOneAndUpdate(
                        {
                            user: user._id,
                            program: programId
                        },
                        {
                            user: user._id,
                            program: programId,
                            programType: programType,
                            userCode: user.userCode, // Denormalized ID
                            paymentId: newPayment._id,
                            status: 'active',
                            source: 'razorpay',
                            enrolledAt: new Date(),
                            // Default validity 1 year if not calculated (simplified for webhook)
                            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                        },
                        { upsert: true, new: true }
                    );
                    logToFile(`[Webhook] Enrolled user: ${enrollment._id}`);
                    console.log(`[Webhook] Enrolled user in program: ${programId}`);

                    // 4. Send Email
                    const fullProg = await Program.findById(programId).lean();
                    const welcomeAddon = fullProg?.welcomeEmailContent || null;
                    const programCode = fullProg?.code || 'N/A';

                    const emailHtml = getEnrollmentEmailTemplate({
                        isNewUser,
                        name: user.name,
                        email: user.email,
                        password: isNewUser ? autoPassword : 'Not Available (Login with existing password)',
                        programType: programType,
                        programCode: programCode,
                        loginUrl: `${process.env.FRONTEND_URL}/login`,
                        welcomeAddon
                    });

                    await sendEmail({
                        to: user.email,
                        subject: isNewUser ? 'Welcome to EdinzTech - Login Credentials' : 'Enrollment Confirmed - EdinzTech',
                        html: emailHtml
                    });

                    // 5. WhatsApp Notification (Non-blocking / Safe)
                    try {
                        const fullProgram = await Program.findById(programId);
                        if (fullProgram) {
                            await whatsappService.sendTemplate(user, fullProgram, 'onEnrolled');
                        }
                    } catch (waError) {
                        console.error("[Webhook] WhatsApp trigger failed:", waError.message);
                    }
                } else {
                    logToFile(`[Webhook] Skipped duplicate payment: ${paymentId}`);
                }
            }
        }
        res.json({ status: 'ok' });
    } else {
        logToFile("[Webhook] Invalid signature");
        console.error("Invalid Webhook Signature");
        res.status(400).json({ error: 'Invalid signature' });
    }
});

// @desc    Verify Razorpay Payment & Enroll User (Frontend Fallback)
// @route   POST /api/payments/verify
// @access  Public (Protected by Signature)
const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        // Signature matches - Payment is Valid
        // Now we need to enroll the user. 
        // We can fetch the order from Razorpay to get the Notes safely.

        try {
            const order = await razorpay.orders.fetch(razorpay_order_id);

            if (!order) {
                res.status(404);
                throw new Error('Order not found on Razorpay');
            }

            const { notes, amount, status } = order;
            // Notes contain: programId, programType, name, email, phone

            const { programId, programType, email, name, phone, year, department, registerNumber, institutionName, state, city, pincode } = notes;

            // Use the same logic as webhook to enroll
            // Check if user exists (Idempotent creation)
            let user = await User.findOne({ email }).select('+encryptedPassword');
            let isNewUser = false;
            let autoPassword = '';

            if (!user) {
                isNewUser = true;
                autoPassword = crypto.randomBytes(8).toString('hex');
                const userCode = generateUserCode();

                try {
                    user = await User.create({
                        name: name || 'Student',
                        email,
                        phone,
                        year,
                        department,
                        registerNumber,
                        institutionName,
                        state,
                        city,
                        pincode,
                        password: autoPassword,
                        encryptedPassword: encrypt(autoPassword),
                        userCode,
                        role: 'student',
                        isActive: true
                    });
                } catch (err) {
                    if (err.code === 11000) {
                        // Race condition: User created by webhook just now
                        console.log(`[Verify] User race condition caught for ${email}`);
                        user = await User.findOne({ email }).select('+encryptedPassword');
                        if (!user) throw err; // Should not happen
                        isNewUser = false; // It exists now
                    } else {
                        throw err;
                    }
                }
            }

            // Create Payment Record (Idempotency Check)
            const existingPayment = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id });

            let paymentId = existingPayment ? existingPayment._id : null;

            if (!existingPayment) {
                try {
                    const newPayment = await Payment.create({
                        razorpayOrderId: razorpay_order_id,
                        razorpayPaymentId: razorpay_payment_id,
                        user: user._id,
                        program: programId,
                        programType: programType,
                        amount: amount / 100,
                        status: 'captured' // Assumed if verified
                    });
                    paymentId = newPayment._id;
                } catch (err) {
                    if (err.code === 11000) {
                        // Race condition: Payment created by webhook
                        console.log(`[Verify] Payment race condition caught for ${razorpay_payment_id}`);
                        const racedPayment = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id });
                        if (racedPayment) paymentId = racedPayment._id;
                        else throw err;
                    } else {
                        throw err;
                    }
                }
            }

            // Enroll (Idempotent: uses findOneAndUpdate upsert)
            // Even if payment existed, we ensure enrollment exists and is linked
            const enrollment = await createOrUpdateEnrollment({
                userId: user._id,
                programId,
                source: 'razorpay',
                paymentId: paymentId,
                userCode: user.userCode,
                programType
            });

            console.log(`[Verify] Manual Verification Success: ${email} -> ${programId}`);

            // Send Email (Only if new user or new payment? Email service might handle duplicate checks or we accept minor spam on retry)
            // Ideally only if !existingPayment

            const welcomeAddon = fullProgram?.welcomeEmailContent || null;
            const programCode = fullProgram?.code || 'N/A';

            let decryptedPassword = 'Not Available (Login with existing password)';
            if (!isNewUser && user.encryptedPassword) {
                decryptedPassword = decrypt(user.encryptedPassword);
            }

            const emailHtml = getEnrollmentEmailTemplate({
                isNewUser,
                name: user.name,
                email: user.email,
                password: isNewUser ? autoPassword : decryptedPassword,
                programType: programType,
                programCode: programCode,
                loginUrl: `${process.env.FRONTEND_URL}/login`,
                welcomeAddon
            });

            if (!existingPayment) {
                sendEmail({
                    to: user.email,
                    subject: isNewUser ? 'Welcome to EdinzTech - Login Credentials' : 'Enrollment Confirmed - EdinzTech',
                    html: emailHtml
                }).catch(err => console.error("Email fail", err));
            }

            // WhatsApp Notification
            try {
                const fullProgram = await Program.findById(programId);
                if (fullProgram) {
                    const waConfig = fullProgram.whatsappConfig?.onEnrolled;
                    console.log(`[Verify] 🟢 Attempting WhatsApp Trigger for Prog: ${programId}`);
                    console.log(`[Verify] WA Config Enabled: ${waConfig?.enabled}, TemplateId: ${waConfig?.templateId}`);

                    const waResult = await whatsappService.sendTemplate(user, fullProgram, 'onEnrolled');
                    console.log(`[Verify] WA Result: ${waResult}`);
                } else {
                    console.log(`[Verify] 🔴 Program not found for WhatsApp trigger`);
                }
            } catch (waError) {
                console.error("[Verify] WhatsApp trigger failed:", waError.message);
            }

            res.json({ status: 'success', message: 'Payment verified and enrolled.' });

        } catch (error) {
            console.error("Verification Logic Error:", error);
            res.status(500).json({ message: 'Internal Server Error during enrollment' });
        }

    } else {
        res.status(400);
        throw new Error('Invalid signature');
    }
});

module.exports = { createOrder, handleWebhook, enrollFree, verifyPayment };
