const asyncHandler = require('express-async-handler');
const Enrollment = require('../models/Enrollment');
const Program = require('../models/Program');
const Certificate = require('../models/Certificate');
const Quiz = require('../models/Quiz');
const FeedbackTemplate = require('../models/FeedbackTemplate');
const User = require('../models/User');

// @desc    Get user's enrollments
// @route   GET /api/me/enrollments
// @access  Private
const getMyEnrollments = asyncHandler(async (req, res) => {
    // Return enrollments with program details
    const enrollments = await Enrollment.find({ user: req.user._id })
        .populate('program', 'title type mode startDate endDate image')
        .sort('-enrolledAt');

    res.json(enrollments);
});

// @desc    Get dashboard overview stats
// @route   GET /api/me/dashboard-overview
// @access  Private
const getDashboardOverview = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = req.user;

    // 1. Fetch User's Enrollments (with Program details)
    const enrollments = await Enrollment.find({ user: userId })
        .populate('program', 'title type validUntil')
        .sort('-enrolledAt');

    // 2. Aggregate Data per Enrollment
    const programsData = await Promise.all(enrollments.map(async (enrollment) => {
        const program = enrollment.program;

        if (!program) return null; // Handle edge case where program might be deleted

        // Fetch Active Quizzes for this Program
        const quizzes = await Quiz.find({
            program: program._id,
            status: 'Published'
        }).select('title type passingScore startTime endTime questions.length');

        // Fetch Active Feedbacks for this Program
        const feedbacks = await FeedbackTemplate.find({
            programId: program._id,
            status: 'Published'
        }).select('title description type endAt');

        return {
            programId: program._id,
            title: program.title,
            type: program.type,
            enrollmentStatus: enrollment.status,
            validUntil: enrollment.validUntil || program.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year if missing
            quizzes: quizzes,
            feedbacks: feedbacks
        };
    }));

    // Filter out nulls
    const validPrograms = programsData.filter(p => p !== null);

    // Stats
    const totalEnrolled = enrollments.length;
    const completedPrograms = enrollments.filter(e => e.status === 'completed').length;
    const activePrograms = enrollments.filter(e => e.status === 'active').length;
    const certificates = await Certificate.countDocuments({ user: userId });

    res.json({
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            institutionName: user.institutionName,
            registerNumber: user.registerNumber,
            role: user.role
        },
        programs: validPrograms,
        stats: {
            totalEnrolled,
            completedPrograms,
            activePrograms,
            certificates
        }
    });
});

// @desc    Get program progress & access status
// @route   GET /api/me/program/:programId/progress
// @access  Private
const getProgramProgress = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const userId = req.user._id;

    const enrollment = await Enrollment.findOne({ user: userId, program: programId });

    if (!enrollment) {
        res.status(403);
        throw new Error('Not enrolled in this program');
    }

    // Check validity
    // If validUntil exists and is past, valid = false
    const now = new Date();
    let isExpired = false;
    if (enrollment.validUntil && new Date(enrollment.validUntil) < now) {
        isExpired = true;
    }

    const program = await Program.findById(programId).select('-offerLetterTemplate -certificateTemplate');

    // Check certificate
    const certificate = await Certificate.findOne({ user: userId, program: programId });

    res.json({
        enrollment,
        isExpired,
        program,
        hasCertificate: !!certificate,
        certificate: certificate || null
    });
});

// @desc    Update user profile
// @route   PUT /api/me/profile
// @access  Private
const updateMyProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.phone = req.body.phone || user.phone;
        user.institutionName = req.body.institutionName || user.institutionName;
        user.registerNumber = req.body.registerNumber || user.registerNumber;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            institutionName: updatedUser.institutionName,
            registerNumber: updatedUser.registerNumber,
            role: updatedUser.role,
            token: req.user.token // Return existing token if needed, or frontend keeps it
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    getMyEnrollments,
    getDashboardOverview,
    getProgramProgress,
    updateMyProfile
};
