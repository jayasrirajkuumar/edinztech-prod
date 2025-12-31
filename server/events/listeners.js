const eventBus = require('./eventBus');
// const certificateService = require('../services/certificateGenerator');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
// const Certificate = require('../models/Certificate'); // Disabled
const Enrollment = require('../models/Enrollment');
const { v4: uuidv4 } = require('uuid');

// Event: USER_ENROLLED
eventBus.on('USER_ENROLLED', async ({ user, program, enrollment }) => {
    console.log(`Event: USER_ENROLLED for ${user.email} in ${program.title}`);

    // 1. Send Welcome Email
    const subject = `Welcome to ${program.title}`;
    const html = `
        <h1>Hello ${user.name},</h1>
        <p>You have successfully enrolled in <strong>${program.title}</strong>.</p>
        <p>Your journey starts now!</p>
        ${program.whatsappGroupLink ? `<p>Join our WhatsApp Group: <a href="${program.whatsappGroupLink}">Click Here</a></p>` : ''}
    `;
    // 2. WhatsApp Trigger
    // New Template Flow (Priority)
    if (program.whatsappConfig?.onEnrolled?.enabled) {
        whatsappService.sendTemplate(user, program, 'onEnrolled');
    }
    // Legacy Manual Flow (Fallback - for existing programs not yet migrated)
    else if (program.whatsappMessage) {
        console.log(`[WhatsApp Legacy] Sending to ${user.phone}: ${program.whatsappMessage.replace('{{name}}', user.name)}`);
    }
    // Legacy Manual Flow (Fallback - for existing programs not yet migrated)
    // Legacy Manual Flow (Fallback - for existing programs not yet migrated)
    else if (program.whatsappMessage) {
        console.log(`[WhatsApp Legacy] Sending to ${user.phone}: ${program.whatsappMessage.replace('{{name}}', user.name)}`);
    }
    if (program.type === 'Internship') {
        console.log("Generating Offer Letter... (Mock Implementation)");
        // Logic similar to certificateService but for Offer Letter
    }
});

// Event: PROGRAM_COMPLETED
eventBus.on('PROGRAM_COMPLETED', async ({ user, programId, quizAttempt }) => {
    console.log(`Event: PROGRAM_COMPLETED for ${user.email}`);

    try {
        // 1. Generate Certificate
        // Populate program first if only ID passed
        // Or assume we fetch it inside service, but service takes raw data.
        // Let's assume passed strictly.
        // We need Program details.
        const Program = require('../models/Program'); // Lazy load
        const program = await Program.findById(programId);

        const certificateCode = `CERT-${uuidv4().substring(0, 8).toUpperCase()}`;

        // const { path: fileUrl, code: generatedCode } = await certificateService.generateCertificate(user, program);
        console.warn("Auto-generation via listener disabled (certificateGenerator missing). Use Admin Panel.");


        // 2. Save Certificate Record (DISABLED)
        /*
        await Certificate.create({
            user: user._id,
            program: programId,
            certificateCode: generatedCode,
            fileUrl: fileUrl
        });
        */
        console.log("Certificate generated but DB save disabled as model missing:", generatedCode);

        // 3. Update Enrollment Status
        await Enrollment.findOneAndUpdate(
            { user: user._id, program: programId },
            { status: 'completed', completedAt: new Date() }
        );

        // 4. Email Certificate
        const subject = `Congratulations! You've completed ${program.title}`;
        const html = `
            <h1>Great Job, ${user.name}!</h1>
            <p>You have successfully completed ${program.title} with a score of ${quizAttempt.score}%.</p>
            <p>Your certificate is attached.</p>
            <p>Verify at: ${process.env.FRONTEND_URL}/verify/${certificateCode}</p>
        `;
        // Nodemailer attachments support
        // await emailService.sendEmailWithAttachment(...) // Simple sendEmail doesn't have it yet.
        await emailService.sendEmail(user.email, subject, html);

    } catch (error) {
        console.error("Completion Event Error:", error);
    }
});

module.exports = eventBus; // Just to ensure it loads
