const asyncHandler = require('express-async-handler');
const OutsiderQuiz = require('../models/OutsiderQuiz');
const OutsiderQuizResult = require('../models/OutsiderQuizResult');
// Removed invalid imports
const path = require('path');
const fs = require('fs');

// @desc    Create a new Outsider Quiz
// @route   POST /api/outsider-quiz/admin
// @access  Admin
const createQuiz = asyncHandler(async (req, res) => {
    const { title, description, questions, timeLimit, certificateTemplate } = req.body;

    if (!title || !questions || questions.length === 0) {
        res.status(400);
        throw new Error('Please providing title and at least one question');
    }

    const quiz = await OutsiderQuiz.create({
        title,
        description,
        questions,
        timeLimit: timeLimit ? Number(timeLimit) : 0,
        certificateTemplate,
        createdBy: req.user._id
    });

    res.status(201).json(quiz);
});

// @desc    Get all Outsider Quizzes (Admin)
// @route   GET /api/outsider-quiz/admin
// @access  Admin
const getQuizzes = asyncHandler(async (req, res) => {
    const quizzes = await OutsiderQuiz.find({}).sort({ createdAt: -1 });
    res.json(quizzes);
});

// @desc    Get Single Quiz (Admin)
// @route   GET /api/outsider-quiz/admin/:id
// @access  Admin
const getQuizAdmin = asyncHandler(async (req, res) => {
    const quiz = await OutsiderQuiz.findById(req.params.id);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }
    res.json(quiz);
});

// @desc    Update Outsider Quiz
// @route   PUT /api/outsider-quiz/admin/:id
// @access  Admin
const updateQuiz = asyncHandler(async (req, res) => {
    const quiz = await OutsiderQuiz.findById(req.params.id);

    if (quiz) {
        quiz.title = req.body.title || quiz.title;
        quiz.description = req.body.description || quiz.description;
        quiz.questions = req.body.questions || quiz.questions;
        quiz.timeLimit = req.body.timeLimit ?? quiz.timeLimit;
        quiz.certificateTemplate = req.body.certificateTemplate || quiz.certificateTemplate;
        quiz.isActive = req.body.isActive ?? quiz.isActive;

        const updatedQuiz = await quiz.save();
        res.json(updatedQuiz);
    } else {
        res.status(404);
        throw new Error('Quiz not found');
    }
});

// @desc    Upload Quiz Template
// @route   POST /api/outsider-quiz/admin/:id/upload-template
// @access  Admin
const uploadQuizTemplate = asyncHandler(async (req, res) => {
    const quiz = await OutsiderQuiz.findById(req.params.id);

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    // Path relative to server root or public URL?
    // uploadMiddleware saves to 'server/uploads'.
    // Frontend likely expects 'uploads/filename.ext'.
    // Since we mount '/uploads' to 'server/uploads' in app.js:
    const templatePath = `uploads/${req.file.filename}`;

    quiz.certificateTemplate = templatePath;
    await quiz.save();

    res.json({
        message: 'Template uploaded successfully',
        path: templatePath
    });
});


// @desc    Get Quiz Results (Admin)
// @route   GET /api/outsider-quiz/admin/:id/results
// @access  Admin
const getQuizResults = asyncHandler(async (req, res) => {
    const results = await OutsiderQuizResult.find({ quizId: req.params.id }).sort({ submittedAt: -1 });
    res.json(results);
});

// --- Public Endpoints ---

// @desc    Get Public Quiz by ID
// @route   GET /api/outsider-quiz/public/:id
// @access  Public
const getPublicQuiz = asyncHandler(async (req, res) => {
    const quiz = await OutsiderQuiz.findById(req.params.id);

    if (!quiz || !quiz.isActive) {
        res.status(404);
        throw new Error('Quiz not found or inactive');
    }

    // Return quiz without exposing correct answers if possible (though for simple quiz app maybe okay)
    // To be safe, let's remove correctAnswer from frontend response if we rely on backend grading
    const safeQuestions = quiz.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks
        // Omit correctAnswer
    }));

    res.json({
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        questions: safeQuestions
    });
});

// @desc    Submit Public Quiz Attempt
// @route   POST /api/outsider-quiz/public/:id/submit
// @access  Public
const submitPublicQuiz = asyncHandler(async (req, res) => {
    const { studentName, email, phone, college, answers } = req.body; // answers: [{ questionId, answer }]
    const quizId = req.params.id;

    const quiz = await OutsiderQuiz.findById(quizId);
    if (!quiz || !quiz.isActive) {
        res.status(404);
        throw new Error('Quiz not found or inactive');
    }

    // Calculate Score
    let score = 0;
    let maxScore = 0;

    quiz.questions.forEach(q => {
        maxScore += q.marks;
        const studentAns = answers.find(a => a.questionId === q._id.toString());
        if (studentAns && studentAns.answer === q.correctAnswer) {
            score += q.marks;
        }
    });

    // Generate Certificate ID
    const certificateId = `QUIZ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Create Result Record
    const result = await OutsiderQuizResult.create({
        quizId: quiz._id,
        studentName,
        email,
        phone,
        college,
        score,
        totalQuestions: quiz.questions.length,
        maxScore,
        certificateId
    });

    // Generate & Email Certificate
    const CERT_SERVICE_URL = process.env.CERT_SERVICE_URL || 'http://localhost:5002/api/generate';
    // We can use a specific callback if we want to track status, or just logging mode.
    // For now, let's assume fire-and-forget or sync/async mix.
    const CALLBACK_URL = process.env.CALLBACK_BASE_URL
        ? `${process.env.CALLBACK_BASE_URL}/api/webhooks/outsider-quiz-status` // Need to implement this if we want status updates
        : `http://localhost:${process.env.PORT || 5000}/api/webhooks/outsider-quiz-status`;

    // Generate QR (Points to general verify or specific endpoint?)
    // Let's stick to standard verify link format for consistency
    const domain = process.env.FRONTEND_URL || 'http://localhost:5173';
    // We can allow verifying these certs too if we add them to a central registry or make verify endpoint smart
    // For now, let's assume it just verifies existence in our DB if we saved it?
    // User requested "same certificate logic".

    // We likely don't have a "verify" endpoint for OutsiderQuizResult yet.
    // Let's point validation to a new route we might add: /verify-quiz?id=...
    const verifyUrl = `${domain}/verify-quiz?certificateId=${certificateId}`;

    // Lazy load libraries inside handler to avoid top-level require errors if missing
    try {
        const QRCode = require('qrcode');
        const axios = require('axios');

        const qrCodeImage = await QRCode.toDataURL(verifyUrl);

        console.log(`[OutsiderQuiz] Triggering Certificate Service for ${email}`);

        // Call Service
        await axios.post(CERT_SERVICE_URL, {
            type: 'certificate', // Reuse standard type
            studentData: {
                name: studentName,
                email: email,
                id: result._id, // Use Result ID as student ID ref
                institutionName: college || 'External',
                programName: quiz.title
            },
            courseData: {
                title: quiz.title,
                id: quiz._id
            },
            certificateId: certificateId,
            templateId: 'default', // Or specific template ID if supported
            templateUrl: quiz.certificateTemplate, // This is key
            qrCode: qrCodeImage,
            callbackUrl: CALLBACK_URL
        });

        console.log(`[OutsiderQuiz] Service Triggered Successfully`);

    } catch (error) {
        console.error("Failed to generate/send certificate:", error.message);
        // We log but don't fail the user response, as the attempt is recorded.
    }

    res.status(201).json({
        success: true,
        message: 'Quiz submitted successfully. Your certificate has been sent to your email.',
        result: {
            score,
            maxScore,
            totalQuestions: quiz.questions.length
        }
    });
});

// @desc    Get All Leads (Quiz Results)
// @route   GET /api/outsider-quiz/admin/leads
// @access  Admin
const getAllLeads = asyncHandler(async (req, res) => {
    const leads = await OutsiderQuizResult.find({})
        .populate('quizId', 'title')
        .sort({ submittedAt: -1 });
    res.json(leads);
});

module.exports = {
    createQuiz,
    getQuizzes,
    getQuizAdmin,
    updateQuiz,
    getQuizResults,
    getPublicQuiz,
    submitPublicQuiz,
    uploadQuizTemplate,
    getAllLeads
};
