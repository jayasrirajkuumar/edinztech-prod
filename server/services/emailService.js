const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text, attachments }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html: html || text, // Fallback
            attachments: attachments || [] // Added support for attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return info;
    } catch (error) {
        console.error('Email Error:', error);
        // Don't throw, just log. Email failure shouldn't crash the flow usually.
        return null;
    }
};

module.exports = { sendEmail };
