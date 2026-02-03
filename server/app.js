const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');

// Routes
const authRoutes = require('./routes/authRoutes');
const programRoutes = require('./routes/programRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const adminRoutes = require('./routes/adminRoutes');
const meRoutes = require('./routes/meRoutes');

// DB
const connectDB = require('./config/db');

// Events (Load listeners)
require('./events/listeners');

const app = express();

// Connect Database
connectDB();

// Middleware
// Middleware
app.use((req, res, next) => {
    if (req.path === '/api/payments/webhook') {
        console.log(`[Req Log] Webhook Hit: ${req.method} ${req.path}`);
    }
    next();
});

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use('/api/webhooks', require('./routes/webhookRoutes')); // Added webhook route handler
// app.use('/api/outsider-quiz', require('./routes/outsiderQuizRoutes')); // Removed
app.use(cors()); // Allow frontend to connect
app.use(helmet({
    crossOriginResourcePolicy: false, // Allow loading images from uploads
}));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/me', require('./routes/meRoutes'));
app.use('/api/programs', require('./routes/programRoutes'));
app.use('/api/payments', paymentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gallery', require('./routes/galleryRoutes')); // Added Gallery Route
app.use('/api/outsider-quiz', require('./routes/outsiderQuizRoutes'));
app.use('/api/contact', require('./routes/contactRoutes')); // Added Contact Route
// app.use('/api/me', meRoutes); // This line is removed as per the instruction's implied change

// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;
