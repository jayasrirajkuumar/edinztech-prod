const asyncHandler = require('express-async-handler');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const FeedbackTemplate = require('../models/FeedbackTemplate');

// @desc    Get Student Dashboard Data
// @route   GET /api/me/dashboard
// @access  Private (Student)
const getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1. Get All Enrollments (Active & Completed)
    const enrollments = await Enrollment.find({
        user: userId,
        // Removed status: 'active' to include completed programs
    }).populate('program', 'title type isFeedbackEnabled');

    // 2. Compute Program Data
    const dashboardData = await Promise.all(enrollments.map(async (enrollment) => {
        if (!enrollment.program) return null; // Skip if program deleted

        // Fetch visible Quizzes
        const quizzes = await Quiz.find({
            program: enrollment.program._id,
            status: 'Published',
            $and: [
                {
                    $or: [
                        { startTime: { $lte: new Date() } },
                        { startTime: null },
                        { startTime: { $exists: false } }
                    ]
                },
                {
                    $or: [
                        { endTime: { $gte: new Date() } },
                        { endTime: null },
                        { endTime: { $exists: false } }
                    ]
                }
            ]
        }).select('title description duration totalMarks startTime endTime');

        // Fetch visible Feedbacks
        const feedbacks = await FeedbackTemplate.find({
            programId: enrollment.program._id,
            status: 'Published'
        }).select('title description type');

        // Check for Default Feedback
        const DefaultFeedbackResponse = require('../models/DefaultFeedbackResponse');
        const defaultSubmitted = await DefaultFeedbackResponse.findOne({
            programId: enrollment.program._id,
            userId: userId
        });

        if (enrollment.program.isFeedbackEnabled && !defaultSubmitted) {
            feedbacks.unshift({
                _id: 'default',
                title: 'Course Completion Feedback',
                description: 'Required for certificate',
                isDefault: true
            });
        }

        return {
            programId: enrollment.program._id,
            title: enrollment.program.title,
            type: enrollment.programType || enrollment.program.type,
            enrollmentStatus: enrollment.status,
            validUntil: enrollment.validUntil,
            startTime: enrollment.enrolledAt, // Mapped for frontend progress bar
            endTime: enrollment.validUntil,   // Mapped for frontend progress bar
            quizzes,
            feedbacks
        };
    }));

    res.json({
        user: {
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            institutionName: req.user.institutionName,
            registerNumber: req.user.registerNumber,
            id: req.user._id
        },
        programs: dashboardData.filter(p => p !== null)
    });
});

module.exports = { getDashboard };
