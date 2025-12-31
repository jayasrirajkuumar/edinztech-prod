const asyncHandler = require('express-async-handler');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Program = require('../models/Program');
const eventBus = require('../events/eventBus');

// @desc    Create a Quiz
// @route   POST /api/admin/quiz
// @access  Admin
const createQuiz = asyncHandler(async (req, res) => {
    const { title, description, programId, passingScore, questions, startTime, endTime } = req.body;

    if (!questions || questions.length === 0) {
        res.status(400);
        throw new Error('Quiz must have at least one question');
    }

    const quiz = await Quiz.create({
        title,
        description,
        program: programId,
        passingScore,
        questions,
        startTime,
        endTime,
        status: 'Draft'
    });

    res.status(201).json(quiz);
});

// @desc    Get Quizzes by Program
// @route   GET /api/quiz/:programId
// @access  Private
const getQuizzesByProgram = asyncHandler(async (req, res) => {
    // If admin, return all. If student, return based on status/enrollment?
    // For now, let's separate: Admin sees all. Student uses /me/quizzes usually.
    // specific endpoint access checks role.

    const quizzes = await Quiz.find({ program: req.params.programId }).sort({ createdAt: -1 });
    res.json(quizzes);
});

// @desc    Get All Quizzes (Admin)
// @route   GET /api/quiz/all
// @access  Admin
const getAllQuizzes = asyncHandler(async (req, res) => {
    const quizzes = await Quiz.find({}).populate('program', 'title').sort({ createdAt: -1 });
    res.json(quizzes);
});

const fs = require('fs');
const path = require('path');

// @desc    Get Student Quizzes (All Enrolled)
// @route   GET /api/quiz/my-quizzes
// @access  Private
const getStudentQuizzes = asyncHandler(async (req, res) => {
    const logPath = path.join(__dirname, '..', 'debug_log.txt');
    const log = (msg) => fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);

    log(`Request received from User ID: ${req.user._id}`);

    // 1. Find user enrollments
    const Enrollment = require('../models/Enrollment');
    const enrollments = await Enrollment.find({ user: req.user._id, status: 'active' });
    const programIds = enrollments.map(e => e.program);

    log(`Found ${enrollments.length} active enrollments. Programs: ${programIds.join(', ')}`);

    // 2. Find published quizzes for these programs
    const quizzes = await Quiz.find({
        program: { $in: programIds },
        status: 'Published'
    })
        .populate('program', 'title') // Include program title
        .sort({ startTime: 1 });

    log(`Found ${quizzes.length} Published quizzes.`);
    quizzes.forEach(q => log(` - Quiz: ${q.title} (${q._id})`));

    res.json(quizzes);
});

// @desc    Update Quiz
// @route   PATCH /api/quiz/:id
// @access  Admin
const updateQuiz = asyncHandler(async (req, res) => {
    const { title, description, passingScore, questions, startTime, endTime, programId, program } = req.body;
    const quiz = await Quiz.findById(req.params.id);

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
    // Allow updating program
    if (programId || program) {
        quiz.program = programId || program;
    }

    const updatedQuiz = await quiz.save();
    res.json(updatedQuiz);
});

// @desc    Delete Quiz
// @route   DELETE /api/quiz/:id
// @access  Admin
const deleteQuiz = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    await quiz.deleteOne();
    res.json({ message: 'Quiz removed' });
});

// @desc    Publish Quiz
// @route   PATCH /api/quiz/:id/publish
// @access  Admin
const publishQuiz = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    if (quiz.questions.length === 0) {
        res.status(400);
        throw new Error('Cannot publish a quiz with no questions');
    }

    if (!quiz.startTime) {
        res.status(400);
        throw new Error('Cannot publish: Start Time is missing');
    }

    if (new Date(quiz.startTime) > new Date()) {
        res.status(400);
        throw new Error(`Cannot publish: Start Time is in the future (${new Date(quiz.startTime).toLocaleString()}). Quiz must remain Draft until then.`);
    }

    quiz.status = 'Published';
    await quiz.save();
    res.json(quiz);
});

// @desc    Unpublish Quiz
// @route   PATCH /api/quiz/:id/unpublish
// @access  Admin
const unpublishQuiz = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    quiz.status = 'Draft';
    await quiz.save();
    res.json(quiz);
});

// @desc    Submit Quiz Attempt
// @route   POST /api/quiz/:id/attempt
// @access  Private
const attemptQuiz = asyncHandler(async (req, res) => {
    const quizId = req.params.id;
    const { answers } = req.body; // Array of { questionId, selectedOption } (using index or value)

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    let score = 0;

    // Calculate Score
    answers.forEach(ans => {
        // Assuming questions have IDs or we map by index
        // Since Schema didn't enforce specific IDs for subdocs, Mongo gives them _id.
        // Let's assume input matches specific logic in FE.

        // Simple Logic: Match index or ID
        const question = quiz.questions.find(q => q._id.toString() === ans.questionId);
        if (question) {
            // Check correctness (Assuming correctOption is index 0-3)
            // Need to verify if 'selectedOption' is the index or the text value.
            // Let's assume Index for simplicity.
            if (parseInt(ans.selectedOption) === question.correctOption) {
                score++;
            }
        }
    });

    const percentage = (score / quiz.questions.length) * 100;
    const passed = percentage >= quiz.passingScore;

    const attempt = await QuizAttempt.create({
        quiz: quizId,
        user: req.user._id,
        answers,
        score: percentage,
        totalQuestions: quiz.questions.length,
        passed
    });

    if (passed) {
        // Check if Program is completed or is this THE completion criteria?
        // Trigger completion event
        eventBus.emit('PROGRAM_COMPLETED', {
            user: req.user,
            programId: quiz.program,
            quizAttempt: attempt
        });
    }

    res.status(201).json({
        score: percentage,
        passed,
        attemptId: attempt._id
    });
});

const uploadQuizImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No image file uploaded');
    }
    // Return the path relative to the server or a full URL
    // Assuming 'uploads' is served statically as /uploads
    const imagePath = `/uploads/${req.file.filename}`;
    res.json({ url: imagePath });
});

// @desc    Get Quiz Reports (Admin)
// @route   GET /api/admin/quiz/:id/reports
// @access  Admin
const getQuizReports = asyncHandler(async (req, res) => {
    const quizId = req.params.id;
    const attempts = await QuizAttempt.find({ quiz: quizId })
        .populate('user', 'name email userCode')
        .sort({ attemptedAt: -1 });

    res.json(attempts);
});

// @desc    Get Single Quiz (Admin/Edit)
// @route   GET /api/quiz/detail/:id
// @access  Admin
const getQuizById = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id).populate('program', 'title');
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }
    res.json(quiz);
});

// @desc    Get Single Quiz Attempt (Admin/Student?)
// @route   GET /api/quiz/attempt/:id
// @access  Private
const getQuizAttempt = asyncHandler(async (req, res) => {
    const attempt = await QuizAttempt.findById(req.params.id)
        .populate('user', 'name email userCode')
        .populate('quiz', 'title questions'); // Need quiz questions for context

    if (!attempt) {
        res.status(404);
        throw new Error('Attempt not found');
    }
    // Access check (Admin or Own attempt)
    if (req.user.role !== 'admin' && attempt.user._id.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    res.json(attempt);
});

module.exports = {
    createQuiz,
    getAllQuizzes,
    getQuizzesByProgram,
    getStudentQuizzes,
    attemptQuiz,
    updateQuiz,
    deleteQuiz,
    publishQuiz,
    unpublishQuiz,
    uploadQuizImage,
    getQuizReports,
    getQuizAttempt,
    getQuizById
};
