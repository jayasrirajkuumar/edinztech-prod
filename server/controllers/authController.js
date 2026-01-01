const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const { decrypt, encrypt } = require('../utils/encryption');
const { sendEmail } = require('../services/emailService');
const crypto = require('crypto');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Prevent admin login here if strict separation requested (or allow mixed)
        // Prompt said "No signup for users (created only after Razorpay success)"
        // But login is needed.
        if (user.role === 'admin') {
            // Optional: Force them to use admin login? Or just allow.
            // For safety, let's allow but maybe warn in logs. 
        }

        // Update Last Login
        user.lastLoginAt = Date.now();
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Auth admin & get token
// @route   POST /api/auth/admin/login
// @access  Public
const authAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (user.role !== 'admin' && !user.isAdmin) {
            res.status(401);
            throw new Error('Not authorized as admin');
        }

        // Update Last Login
        user.lastLoginAt = Date.now();
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Forgot Password (email credentials)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    let decryptedPassword;
    let isReset = false;

    if (user.encryptedPassword) {
        try {
            decryptedPassword = decrypt(user.encryptedPassword);
        } catch (error) {
            console.error("Decryption failed for user:", user._id);
            // Fallthrough to reset if decryption fails
        }
    }

    if (!decryptedPassword) {
        // Generate new password if one doesn't exist or decryption failed
        const newPassword = crypto.randomBytes(8).toString('hex');

        user.password = newPassword; // Will be hashed by pre-save
        user.encryptedPassword = encrypt(newPassword);
        await user.save();

        decryptedPassword = newPassword;
        isReset = true;
    }

    const loginUrl = process.env.FRONTEND_URL || 'http://72.60.103.246/login';
    const emailSubject = isReset ? `Login Credentials Reset - EdinzTech` : `Login Credentials Recovery - EdinzTech`;

    let emailBody = `<h3>Hello ${user.name},</h3>`;

    if (isReset) {
        emailBody += `<p>We noticed you didn't have a retrievable password set up, so we have generated a new one for you.</p>`;
    } else {
        emailBody += `<p>You requested to recover your login credentials.</p>`;
    }

    emailBody += `
        <p><b>Username:</b> ${user.email}</p>
        <p><b>Password:</b> ${decryptedPassword}</p>
        <p>Login here: <a href="${loginUrl}">${loginUrl}</a></p>
        ${isReset ? `<p><em>You can change this password after logging in.</em></p>` : ''}
        <p>If you did not request this, please contact support immediately.</p>
    `;

    try {
        await sendEmail({
            to: user.email,
            subject: emailSubject,
            html: emailBody
        });
        res.json({ message: 'Credentials sent to your email.' });
    } catch (error) {
        console.error("Forgot Password Email Error:", error);
        res.status(500);
        throw new Error('Failed to send email.');
    }
});

module.exports = { authUser, authAdmin, getUserProfile, forgotPassword };
