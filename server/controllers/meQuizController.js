const asyncHandler = require('express-async-handler');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// @desc    Get My Visible Quizzes
// @route   GET /api/me/quizzes
// @access  Private
const getMyQuizzes = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1. Get all active program IDs for this user
    // Fix: Allow open-ended enrollments (validUntil missing/null) OR future validUntil
    const enrollments = await Enrollment.find({
        user: userId,
        status: 'active',
        $or: [
            { validUntil: { $gte: new Date() } },
            { validUntil: { $exists: false } }, // Field missing
            { validUntil: null }                // Field is null
        ]
    }).select('program');

    const programIds = enrollments.map(e => e.program);
    console.log(`[DEBUG] User ${userId} has active enrollments in programs:`, programIds);

    if (programIds.length === 0) {
        console.log(`[DEBUG] No active enrollments found for user ${userId}`);
        return res.json([]);
    }

    // 2. Find published quizzes for these programs (ALL)
    const quizzes = await Quiz.find({
        program: { $in: programIds },
        status: 'Published'
    })
        .populate('program', 'title')
        .sort({ startTime: 1 });

    console.log(`[DEBUG] Found ${quizzes.length} published quizzes for programs: ${programIds}`);

    // 3. Attach attempt status
    const quizzesWithStatus = await Promise.all(quizzes.map(async (quiz) => {
        const attempt = await QuizAttempt.findOne({
            quiz: quiz._id,
            user: userId
        }).select('_id passed score status');

        return {
            ...quiz.toObject(),
            isAttempted: !!attempt,
            attemptDetails: attempt
        };
    }));

    res.json(quizzesWithStatus);
});

// @desc    Get Specific Quiz (Strict Enrollment Check)
// @route   GET /api/me/quizzes/:id
// @access  Private
const getMyQuiz = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    if (quiz.status !== 'Published') {
        res.status(403);
        throw new Error('Quiz is not published');
    }

    // Strict Access Check
    const enrollment = await Enrollment.findOne({
        user: userId,
        program: quiz.program,
        status: 'active',
        $or: [
            { validUntil: { $gte: new Date() } },
            { validUntil: { $exists: false } },
            { validUntil: null }
        ]
    });

    if (!enrollment) {
        res.status(403);
        throw new Error('You are not enrolled in the program for this quiz or your enrollment has expired.');
    }

    // Check Quiz Timing
    const currentTime = new Date();
    if (quiz.startTime && currentTime < new Date(quiz.startTime)) {
        res.status(403);
        throw new Error(`Quiz has not started yet. Starts at: ${new Date(quiz.startTime).toLocaleString()}`);
    }

    if (quiz.endTime && currentTime < new Date(quiz.endTime)) {
        // Allow access if end time is in future
    } else if (quiz.endTime && currentTime > new Date(quiz.endTime)) {
        res.status(403);
        throw new Error('Quiz has ended.');
    }

    // Check for existing attempt first
    const attempt = await QuizAttempt.findOne({
        quiz: quiz._id,
        user: userId
    });

    const quizData = quiz.toObject();
    if (attempt) {
        quizData.attempt = attempt;
    }

    // Time Check (Only if not already attempted)
    // If attempted, user can view results even if time is over.
    const now = new Date();
    if (!attempt) {
        if (now < new Date(quiz.startTime)) {
            res.status(403);
            throw new Error(`Quiz has not started yet. Starts at ${new Date(quiz.startTime).toLocaleString()}`);
        }
        if (now > new Date(quiz.endTime)) {
            res.status(403);
            throw new Error('Quiz has ended.');
        }
    }

    res.json(quizData);
});

// @desc    Submit Quiz Attempt
// @route   POST /api/me/quizzes/:id/submit
// @access  Private
const submitQuizAttempt = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const quizId = req.params.id;
    const { answers } = req.body; // { questionIndex: selectedOptionIndex }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    // Access & Time Check (Reuse logic or abstract it? simplified here)
    if (new Date() > new Date(quiz.endTime)) {
        res.status(400);
        throw new Error('Quiz deadline has passed');
    }

    // Verify Enrollment
    const enrollment = await Enrollment.findOne({
        user: userId,
        program: quiz.program,
        status: 'active'
    });
    if (!enrollment) {
        res.status(403);
        throw new Error('Not authorized to attempt this quiz');
    }

    // Calculate Score
    let totalScore = 0;
    let totalMaxScore = 0;
    let hasPending = false;

    const processedAnswers = [];

    quiz.questions.forEach(question => {
        const qId = question._id.toString();
        // Determine how frontend sends answers. 
        // Let's assume 'answers' is an object { [qId]: { option: index, text: string } } 
        // OR an array of objects matching frontend structure.
        // Step 437's meQuizController had: answers = { index: option } (Keys were indices).
        // Let's adapt to new schema: answers = { [questionIndex]: value } or better { [questionId]: value }
        // BUT `QuizForm` used indices. Let's support both or stick to Index if IDs are tricky.
        // Actually, let's look at the input 'answers'. 
        // If we switch to IDs in frontend, we use IDs. If Index, we use Index.
        // Let's assume answers is: { [questionIndex]: { type: 'mcq'|'text', value: ... } }
        // OR simpler: just the answer value, and we infer from question index.

        // Let's iterate using Index to match the incoming answers object from Step 437 logic (Object.keys(answers)).
    });

    // Re-writing loop to work with existing Index-based logic but enhanced:
    // answers: { "0": "1", "1": "Some text" } (where value is string)

    quiz.questions.forEach((question, index) => {
        const submittedValue = answers[index]; // Value from frontend
        let isCorrect = false;
        let marksAwarded = 0;
        let selectedOption = null;
        let textAnswer = null;

        totalMaxScore += question.marks || 1;

        if (submittedValue !== undefined) {
            if (question.type === 'mcq') {
                selectedOption = parseInt(submittedValue);
                if (selectedOption === question.correctOption) {
                    isCorrect = true;
                    marksAwarded = question.marks || 1;
                }
            } else if (question.type === 'text') {
                textAnswer = submittedValue;
                // Text answers are pending by default
                hasPending = true;
            } else if (question.type === 'file_upload') {
                textAnswer = submittedValue; // This will be the File URL
                // File uploads are always pending manual review
                if (submittedValue) hasPending = true;
            }
        }

        totalScore += marksAwarded;

        processedAnswers.push({
            questionId: question._id,
            questionType: question.type,
            selectedOption,
            textAnswer,
            isCorrect,
            marksAwarded
        });
    });

    const scorePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    const passed = scorePercentage >= quiz.passingScore;
    const status = hasPending ? 'Pending Review' : 'Graded';

    const attempt = await QuizAttempt.create({
        quiz: quizId,
        user: userId,
        answers: processedAnswers,
        score: scorePercentage, // Percentage
        totalMaxScore,
        passed: hasPending ? false : passed, // If pending, pass status is tentative or false? Let's say false until graded.
        status,
        attemptedAt: Date.now()
    });

    res.json({
        success: true,
        score: scorePercentage,
        passed: hasPending ? false : passed,
        status,
        attemptId: attempt._id,
        summary: hasPending
            ? `Quiz submitted! Your MCQ score is ${totalScore}/${totalMaxScore}. Written answers are pending review.`
            : `You scored ${totalScore}/${totalMaxScore} (${Math.round(scorePercentage)}%).`
    });
});

module.exports = { getMyQuizzes, getMyQuiz, submitQuizAttempt };
