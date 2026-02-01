const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const log = (msg) => {
    try {
        fs.appendFileSync(path.join(__dirname, '..', 'debug_log.txt'), `[AUTH ${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {
        // ignore log errors
    }
};

const protect = asyncHandler(async (req, res, next) => {
    let token;

    log(`Checking Auth for: ${req.method} ${req.originalUrl}`);

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            log(`Token found: ${token.substring(0, 10)}...`);

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            log(`Token decoded ID: ${decoded.id}`);

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                log('User Not Found in DB');
                res.status(401);
                throw new Error('Not authorized, user not found');
            }
            log(`User Authenticated: ${req.user.email} (${req.user._id})`);
            next();
        } catch (error) {
            log(`Auth Error: ${error.message}`);
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        log('No Token Provided');
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as an admin');
    }
};

module.exports = { protect, admin };
