const { sendEmail } = require('../services/emailService');

const sendContactEmail = async (req, res) => {
    try {
        const { name, email, message, phone } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const subject = `New Contact Query from ${name}`;
        const text = `
            Name: ${name}
            Email: ${email}
            Phone: ${phone || 'Not provided'}
            
            Message:
            ${message}
        `;

        const html = `
            <h3>New Contact Query</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <br/>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br/>')}</p>
        `;

        // Send to Admin (using credentials from env, typically sending to oneself or a configured admin email)
        // Assuming EMAIL_USER is the admin email or we want to receive it there.
        // If there is a specific admin receiver different from sender, it should be in env, 
        // but for now sending to EMAIL_USER (the sender itself) or a hardcoded admin email if known.
        // Usually 'to' is the recipient. Let's assume the system sends TO the admin FROM the system.
        // Note: In emailService.js, 'from' is process.env.EMAIL_FROM. 
        // We want to send 'to' the admin. Let's use EMAIL_USER as admin for now, or maybe EMAIL_FROM.
        // Let's assume we want to receive it at the same address we send from, or a specific support email.

        await sendEmail({
            to: process.env.EMAIL_USER, // Send to the account owner/admin
            subject,
            text,
            html
        });

        res.status(200).json({ message: 'Message sent successfully' });

    } catch (error) {
        console.error('Contact Email Error:', error);
        res.status(500).json({ message: 'Server Error: Failed to send message' });
    }
};

module.exports = {
    sendContactEmail
};
