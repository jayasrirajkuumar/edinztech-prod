const asyncHandler = require('express-async-handler');
const OutsiderQuiz = require('../models/OutsiderQuiz');
const OutsiderQuizAttempt = require('../models/OutsiderQuizAttempt');
const { generateAndSendCertificate } = require('../services/outsiderCertificateService');

// @desc    Create an Outsider Quiz (Admin)
// @route   POST /api/outsider-quiz
// @access  Admin
const createOutsiderQuiz = asyncHandler(async (req, res) => {
    const { title, description, passingScore, questions, startTime, endTime } = req.body;

    if (!questions || questions.length === 0) {
        res.status(400);
        throw new Error('Quiz must have at least one question');
    }

    const quiz = await OutsiderQuiz.create({
        title,
        description,
        passingScore,
        questions,
        startTime,
        endTime,
        endTime,
        status: 'Draft',
        enableCertificates: req.body.enableCertificates || false
    });

    res.status(201).json(quiz);
});

// @desc    Get All Outsider Quizzes (Admin)
// @route   GET /api/outsider-quiz/admin/all
// @access  Admin
const getAllOutsiderQuizzes = asyncHandler(async (req, res) => {
    const quizzes = await OutsiderQuiz.find({}).sort({ createdAt: -1 });
    res.json(quizzes);
});

// @desc    Get Single Quiz (Public)
// @route   GET /api/outsider-quiz/public/:id
// @access  Public
const getPublicQuiz = asyncHandler(async (req, res) => {
    const quiz = await OutsiderQuiz.findById(req.params.id);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    // Only allow if published?
    // User said "Once if the admin publishes only this quizzes can students attend"
    // So yes, enforce published status for public access.
    if (quiz.status !== 'Published') {
        res.status(404); // Hide it
        throw new Error('Quiz is not active');
    }

    // Sanitize: Do not send correct answers
    const sanitizedQuestions = quiz.questions.map(q => {
        const qObj = q.toObject();
        delete qObj.correctOption;
        delete qObj.correctAnswer;
        return qObj;
    });

    const publicQuiz = quiz.toObject();
    publicQuiz.questions = sanitizedQuestions;

    res.json(publicQuiz);
});

// @desc    Submit Public Quiz Attempt
// @route   POST /api/outsider-quiz/public/:id/attempt
// @access  Public
const attemptPublicQuiz = asyncHandler(async (req, res) => {
    const quizId = req.params.id;
    const { userDetails, answers } = req.body;

    if (!userDetails || !userDetails.name || !userDetails.email || !userDetails.phone || !userDetails.college || !userDetails.education) {
        res.status(400);
        throw new Error('Missing required user details');
    }

    const quiz = await OutsiderQuiz.findById(quizId);
    if (!quiz || quiz.status !== 'Published') {
        res.status(404);
        throw new Error('Quiz not found or not active');
    }

    let score = 0;
    // Calculate Score
    answers.forEach(ans => {
        const question = quiz.questions.find(q => q._id.toString() === ans.questionId);
        if (question) {
            if (question.type === 'mcq') {
                const answerText = ans.answer || ans.selectedOption; // Frontend sends 'answer' (text)
                const selectedIndex = question.options.findIndex(opt => opt === answerText);

                if (selectedIndex !== -1 && selectedIndex === question.correctOption) {
                    score++;
                }
            }
            // Text answers grading logic could be added here or marked for manual review
        }
    });

    const percentage = (score / quiz.questions.length) * 100;
    const passed = percentage >= quiz.passingScore;

    const attempt = await OutsiderQuizAttempt.create({
        quiz: quizId,
        userDetails,
        answers,
        score: percentage,
        totalMaxScore: quiz.questions.length, // Store raw max score too
        passed
    });

    // Send Certificate if enabled and passed (or just enabled?)
    // User logic: "Achieving score of XX".
    if (quiz.enableCertificates) {
        generateAndSendCertificate(userDetails, quiz, percentage);
    }

    res.status(201).json({
        score: percentage,
        passed,
        attemptId: attempt._id
    });
});

// @desc    Get Quiz Reports/Leads (Admin)
// @route   GET /api/outsider-quiz/admin/:id/leads
// @access  Admin
const getOutsiderQuizLeads = asyncHandler(async (req, res) => {
    const quizId = req.params.id;
    const attempts = await OutsiderQuizAttempt.find({ quiz: quizId }).sort({ attemptedAt: -1 });
    res.json(attempts);
});

// @desc    Update Outsider Quiz
// @route   PATCH /api/outsider-quiz/:id
// @access  Admin
const updateOutsiderQuiz = asyncHandler(async (req, res) => {
    const { title, description, passingScore, questions, startTime, endTime } = req.body;
    const quiz = await OutsiderQuiz.findById(req.params.id);

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    quiz.title = title || quiz.title;
    quiz.description = description || quiz.description;
    quiz.passingScore = passingScore || quiz.passingScore;
    quiz.questions = questions || quiz.questions;
    quiz.startTime = startTime || quiz.startTime;
    quiz.endTime = endTime || quiz.endTime;
    if (req.body.status) quiz.status = req.body.status;
    if (req.body.enableCertificates !== undefined) quiz.enableCertificates = req.body.enableCertificates;

    const updatedQuiz = await quiz.save();
    res.json(updatedQuiz);
});

// @desc    Delete Outsider Quiz
// @route   DELETE /api/outsider-quiz/:id
// @access  Admin
const deleteOutsiderQuiz = asyncHandler(async (req, res) => {
    const quiz = await OutsiderQuiz.findById(req.params.id);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }
    await quiz.deleteOne();
    res.json({ message: 'Quiz removed' });
});

// @desc    Publish/Unpublish
// @route   PATCH /api/outsider-quiz/:id/status
// @access  Admin
const updateQuizStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const quiz = await OutsiderQuiz.findById(req.params.id);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }
    quiz.status = status;
    await quiz.save();
    res.json(quiz);
});

// @desc    Get Single Quiz (Admin - Full Details)
// @route   GET /api/outsider-quiz/admin/:id
// @access  Admin
const getAdminQuizById = asyncHandler(async (req, res) => {
    const quiz = await OutsiderQuiz.findById(req.params.id);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }
    res.json(quiz);
});


// @desc    Upload Quiz Template
// @route   POST /api/outsider-quiz/admin/:id/upload-template
// @access  Admin
const uploadOutsiderQuizTemplate = asyncHandler(async (req, res) => {
    const quiz = await OutsiderQuiz.findById(req.params.id);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    const templatePath = `/uploads/${req.file.filename}`;
    quiz.certificateTemplate = templatePath;
    await quiz.save();

    res.json({
        message: 'Template uploaded',
        template: templatePath
    });
});

// @desc    Duplicate Outsider Quiz
// @route   POST /api/outsider-quiz/admin/:id/duplicate
// @access  Admin
const duplicateOutsiderQuiz = asyncHandler(async (req, res) => {
    const originalQuiz = await OutsiderQuiz.findById(req.params.id);
    if (!originalQuiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    const newQuiz = await OutsiderQuiz.create({
        title: `${originalQuiz.title} (Copy)`,
        description: originalQuiz.description,
        passingScore: originalQuiz.passingScore,
        questions: originalQuiz.questions,
        startTime: originalQuiz.startTime,
        endTime: originalQuiz.endTime,
        status: 'Draft',
        certificateTemplate: originalQuiz.certificateTemplate
    });

    res.status(201).json(newQuiz);
});

module.exports = {
    createOutsiderQuiz,
    getAllOutsiderQuizzes,
    getPublicQuiz,
    attemptPublicQuiz,
    getOutsiderQuizLeads,
    updateOutsiderQuiz,
    deleteOutsiderQuiz,
    updateQuizStatus,
    getAdminQuizById,
    uploadOutsiderQuizTemplate,
    duplicateOutsiderQuiz
};
