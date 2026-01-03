const asyncHandler = require('express-async-handler');
const FeedbackTemplate = require('../models/FeedbackTemplate');
const FeedbackResponse = require('../models/FeedbackResponse');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');

// @desc    Create Feedback Template
// @route   POST /api/feedback/admin
// @access  Admin
const createFeedback = asyncHandler(async (req, res) => {
    const { title, description, programId, questions, startAt, endAt } = req.body;

    if (!questions || questions.length === 0) {
        res.status(400);
        throw new Error('Feedback must have at least one question');
    }

    const feedback = await FeedbackTemplate.create({
        title,
        description,
        programId,
        questions,
        startAt: startAt || null,
        endAt: endAt || null,
        createdBy: req.user._id,
        status: 'Draft'
    });

    res.status(201).json(feedback);
});

// @desc    Get All Feedbacks (Admin)
// @route   GET /api/feedback/admin
// @access  Admin
const getAdminFeedbacks = asyncHandler(async (req, res) => {
    const keyword = req.query.keyword ? {
        title: {
            $regex: req.query.keyword,
            $options: 'i',
        },
    } : {};

    const statusFilter = req.query.status && req.query.status !== 'All'
        ? { status: req.query.status }
        : {};

    const feedbacks = await FeedbackTemplate.find({ ...keyword, ...statusFilter })
        .populate('programId', 'title')
        .sort({ createdAt: -1 });
    res.json(feedbacks);
});

// @desc    Get Single Feedback with Stats
// @route   GET /api/feedback/admin/:id
// @access  Admin
const getFeedbackById = asyncHandler(async (req, res) => {
    const feedback = await FeedbackTemplate.findById(req.params.id).populate('programId', 'title');
    if (!feedback) {
        res.status(404);
        throw new Error('Feedback not found');
    }

    // Aggregate stats
    const totalResponses = await FeedbackResponse.countDocuments({ feedbackId: feedback._id });

    // For detailed stats per question, we'll do a simple aggregation or fetch responses
    // For MVP, letting frontend calculate complex charts or doing simple counts here
    // Let's do simple counts here using Aggregation

    const stats = await FeedbackResponse.aggregate([
        { $match: { feedbackId: feedback._id } },
        { $unwind: "$answers" },
        {
            $group: {
                _id: { questionId: "$answers.questionId", value: "$answers.value" },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: "$_id.questionId",
                counts: { $push: { value: "$_id.value", count: "$count" } }
            }
        }
    ]);

    res.json({
        ...feedback.toObject(),
        stats: {
            totalResponses,
            questionStats: stats
        }
    });
});

// @desc    Update Feedback
// @route   PUT /api/feedback/admin/:id
// @access  Admin
const updateFeedback = asyncHandler(async (req, res) => {
    const feedback = await FeedbackTemplate.findById(req.params.id);
    if (!feedback) {
        res.status(404);
        throw new Error('Feedback not found');
    }

    if (feedback.status === 'Published') {
        res.status(400);
        throw new Error('Cannot update a published feedback. Unpublish it first.');
    }

    const updatedFeedback = await FeedbackTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedFeedback);
});

// @desc    Publish Feedback
// @route   PATCH /api/feedback/admin/:id/publish
// @access  Admin
const publishFeedback = asyncHandler(async (req, res) => {
    const feedback = await FeedbackTemplate.findById(req.params.id);
    if (!feedback) {
        res.status(404);
        throw new Error('Feedback not found');
    }

    feedback.status = 'Published';
    feedback.publishedAt = Date.now();
    await feedback.save();

    // Notify logic can go here (omitted for MVP requirements)

    res.json(feedback);
});

// @desc    Unpublish Feedback
// @route   PATCH /api/feedback/admin/:id/unpublish
// @access  Admin
const unpublishFeedback = asyncHandler(async (req, res) => {
    const feedback = await FeedbackTemplate.findById(req.params.id);
    if (!feedback) {
        res.status(404);
        throw new Error('Feedback not found');
    }

    feedback.status = 'Draft';
    await feedback.save();
    res.json(feedback);
});

// @desc    Delete Feedback
// @route   DELETE /api/feedback/admin/:id
// @access  Admin
const deleteFeedback = asyncHandler(async (req, res) => {
    const feedback = await FeedbackTemplate.findById(req.params.id);
    if (!feedback) {
        res.status(404);
        throw new Error('Feedback not found');
    }

    await feedback.deleteOne();
    await FeedbackResponse.deleteMany({ feedbackId: feedback._id }); // Cleanup responses

    res.json({ message: 'Feedback removed' });
});

// @desc    Get Student Feedbacks
// @route   GET /api/feedback/me
// @access  Private
const getMyFeedbacks = asyncHandler(async (req, res) => {
    // 1. Get active enrollments
    const enrollments = await Enrollment.find({ user: req.user._id, status: 'active' });
    const programIds = enrollments.map(e => e.program);

    // 2. Get Published feedbacks for these programs
    const now = new Date();
    const feedbacks = await FeedbackTemplate.find({
        programId: { $in: programIds },
        status: 'Published'
    }).populate('programId', 'title');

    // 3. Mark status based on Schedule and Submission
    // We need to check which ones are already submitted
    const submittedIds = await FeedbackResponse.distinct('feedbackId', { userId: req.user._id });

    const result = feedbacks.map(fb => {
        const isSubmitted = submittedIds.some(id => id.toString() === fb._id.toString());
        let status = 'Available';

        if (fb.startAt && now < fb.startAt) status = 'Scheduled';
        if (fb.endAt && now > fb.endAt) status = 'Closed';
        if (isSubmitted) status = 'Completed';

        return {
            ...fb.toObject(),
            userStatus: status
        };
    });

    res.json(result);
});

// @desc    Get Feedback for Submission
// @route   GET /api/feedback/me/:id
// @access  Private
const getFeedbackForSubmission = asyncHandler(async (req, res) => {
    const feedback = await FeedbackTemplate.findById(req.params.id).populate('programId', 'title');
    if (!feedback) {
        res.status(404);
        throw new Error('Feedback not found');
    }

    // Security check: User must be enrolled
    const enrollment = await Enrollment.findOne({
        user: req.user._id,
        program: feedback.programId,
        status: 'active'
    });

    if (!enrollment && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not enrolled in this program');
    }

    res.json(feedback);
});

// @desc    Submit Feedback
// @route   POST /api/feedback/me/:id
// @access  Private
const submitFeedback = asyncHandler(async (req, res) => {
    const feedback = await FeedbackTemplate.findById(req.params.id);
    if (!feedback) {
        res.status(404);
        throw new Error('Feedback not found');
    }

    const enrollment = await Enrollment.findOne({
        user: req.user._id,
        program: feedback.programId,
        status: 'active'
    });

    if (!enrollment) {
        res.status(403);
        throw new Error('Not enrolled in this program');
    }

    // Check duplicate
    const existing = await FeedbackResponse.findOne({
        feedbackId: feedback._id,
        userId: req.user._id,
        enrollmentId: enrollment._id
    });

    if (existing) {
        res.status(400);
        throw new Error('Feedback already submitted');
    }

    const response = await FeedbackResponse.create({
        feedbackId: feedback._id,
        programId: feedback.programId,
        userId: req.user._id,
        enrollmentId: enrollment._id,
        answers: req.body.answers
    });

    // Update Enrollment & Trigger Certificate
    enrollment.isFeedbackSubmitted = true;
    await enrollment.save();

    if (enrollment.certificateStatus === 'PENDING_FEEDBACK') {
        try {
            const Program = require('../models/Program');
            const program = await Program.findById(feedback.programId);
            const { generateCertificateForEnrollment } = require('./certificateController');
            await generateCertificateForEnrollment(enrollment, program, req.user);
        } catch (error) {
            console.error('Auto-certificate generation failed:', error);
        }
    }

    res.status(201).json(response);
});

// @desc    Export Feedback Responses (CSV)
// @route   GET /api/feedback/admin/:id/export
// @access  Admin
const exportFeedbackResponses = asyncHandler(async (req, res) => {
    const feedback = await FeedbackTemplate.findById(req.params.id);
    if (!feedback) {
        res.status(404);
        throw new Error('Feedback not found');
    }

    const responses = await FeedbackResponse.find({ feedbackId: feedback._id })
        .populate('userId', 'name email')
        .sort({ submittedAt: -1 });

    // Simple CSV construction
    // Headers: Submitted At, User Name, User Email, [Question Text 1], [Question Text 2]...
    const questionHeaders = feedback.questions.map(q => `"${q.text.replace(/"/g, '""')}"`).join(',');
    let csv = `Submitted At,User Name,User Email,${questionHeaders}\n`;

    responses.forEach(resp => {
        const row = [
            resp.submittedAt.toISOString(),
            `"${resp.userId?.name || 'Unknown'}"`,
            `"${resp.userId?.email || 'Unknown'}"`
        ];

        // Map answers to columns
        feedback.questions.forEach(q => {
            const ans = resp.answers.find(a => a.questionId === q.id);
            let val = ans ? ans.value : '';
            if (Array.isArray(val)) val = val.join('; ');
            row.push(`"${String(val).replace(/"/g, '""')}"`);
        });

        csv += row.join(',') + '\n';
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`feedback-${feedback._id}.csv`);
    res.send(csv);
});

// @desc    Get Pending Default Feedbacks
// @route   GET /api/feedback/me/default-pending
// @access  Private
const getPendingDefaultFeedbacks = asyncHandler(async (req, res) => {
    // 1. Get active enrollments
    // 2. Check program.isFeedbackEnabled
    // 3. Check if not already submitted

    // Using aggregation for efficiency? Or simple loops.
    // Let's use loop for readability first.

    const enrollments = await Enrollment.find({ user: req.user._id, status: 'active' })
        .populate('program');

    const pending = [];

    for (const enrollment of enrollments) {
        if (enrollment.program && enrollment.program.isFeedbackEnabled) {
            const existing = await DefaultFeedbackResponse.findOne({
                programId: enrollment.program._id,
                userId: req.user._id
            });

            if (!existing) {
                pending.push({
                    ...enrollment.program.toObject(),
                    enrollmentId: enrollment._id
                });
            }
        }
    }

    res.json(pending);
});

// @desc    Submit Public Feedback (Email Verification)
// @route   POST /api/feedback/public
// @access  Public
const submitPublicFeedback = asyncHandler(async (req, res) => {
    const { programId, name, email, feedback, rating } = req.body;

    if (!email || !programId || !feedback) {
        res.status(400);
        throw new Error('Please provide email, program, and feedback');
    }

    // 1. Verify User exists by Email
    const User = require('../models/User'); // Lazy load
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('No account found with this email. Please enroll first.');
    }

    // 2. Verify Enrollment
    const enrollment = await Enrollment.findOne({
        user: user._id,
        program: programId,
        status: 'active'
    });

    if (!enrollment) {
        res.status(403);
        throw new Error('You are not enrolled in this program.');
    }

    // 3. Check Duplicate Feedback
    const DefaultFeedbackResponse = require('../models/DefaultFeedbackResponse'); // Lazy load
    const existing = await DefaultFeedbackResponse.findOne({
        programId,
        userId: user._id
    });

    if (existing) {
        res.status(400);
        throw new Error('You have already submitted feedback for this program.');
    }

    // 4. Create Feedback
    // 4. Create Feedback
    const response = await DefaultFeedbackResponse.create({
        programId,
        userId: user._id,
        name: name || user.name,
        email: user.email,
        feedback,
        inspireId: enrollment.userCode || 'Public',
        // Optional fields
        submittedAt: new Date()
    });

    enrollment.isFeedbackSubmitted = true;
    await enrollment.save();

    if (enrollment.certificateStatus === 'PENDING_FEEDBACK') {
        try {
            const Program = require('../models/Program');
            const program = await Program.findById(programId);
            const { generateCertificateForEnrollment } = require('./certificateController');
            await generateCertificateForEnrollment(enrollment, program, user);
        } catch (error) {
            console.error('Auto-certificate generation failed:', error);
        }
    }

    res.status(201).json({ success: true, message: 'Feedback submitted successfully' });
});

// @desc    Submit Default Feedback
// @route   POST /api/feedback/me/default
// @access  Private
const submitDefaultFeedback = asyncHandler(async (req, res) => {
    const { programId, inspireId, name, organization, email, mobile, place, state, feedback } = req.body;

    const program = await mongoose.model('Program').findById(programId);
    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }
    // Skipped isFeedbackEnabled check as per user request to simplify

    // Check enrollment
    const enrollment = await Enrollment.findOne({
        user: req.user._id,
        program: programId,
        status: 'active'
    });

    if (!enrollment) {
        res.status(403);
        throw new Error('Not enrolled');
    }

    // Check duplicate
    const existing = await DefaultFeedbackResponse.findOne({
        programId,
        userId: req.user._id
    });

    if (existing) {
        res.status(400);
        throw new Error('Already submitted');
    }

    const response = await DefaultFeedbackResponse.create({
        programId,
        userId: req.user._id,
        inspireId, name, organization, email, mobile, place, state, feedback
    });

    // Update Enrollment & Trigger Certificate
    enrollment.isFeedbackSubmitted = true;
    await enrollment.save();

    if (enrollment.certificateStatus === 'PENDING_FEEDBACK') {
        try {
            const { generateCertificateForEnrollment } = require('./certificateController');
            await generateCertificateForEnrollment(enrollment, program, req.user);
        } catch (error) {
            console.error('Auto-certificate generation failed:', error);
        }
    }

    res.status(201).json(response);
});

// @desc    Get All Default/Public Feedbacks (Admin Dashboard)
// @route   GET /api/feedback/admin/default
// @access  Admin
const getAllDefaultFeedbacks = asyncHandler(async (req, res) => {
    const { keyword, programId } = req.query;

    console.log('GET Feedbacks Request:', { keyword, programId });

    let query = {};
    if (programId && programId !== '' && programId !== 'undefined') {
        query.programId = programId;
    }
    if (keyword) {
        query.$or = [
            { name: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { feedback: { $regex: keyword, $options: 'i' } }
        ];
    }

    console.log('Feedback Query:', JSON.stringify(query));

    const DefaultFeedbackResponse = require('../models/DefaultFeedbackResponse'); // Lazy load
    const feedbacks = await DefaultFeedbackResponse.find(query)
        .populate('programId', 'title')
        .sort({ submittedAt: -1 });

    console.log('Feedbacks found:', feedbacks.length);

    res.json(feedbacks);
});

// @desc    Export All Default Feedbacks (CSV)
// @route   GET /api/feedback/admin/default/export
// @access  Admin
const exportAllDefaultFeedbacks = asyncHandler(async (req, res) => {
    const { programId } = req.query;
    let query = {};
    if (programId) {
        query.programId = programId;
    }

    const DefaultFeedbackResponse = require('../models/DefaultFeedbackResponse'); // Lazy load
    const feedbacks = await DefaultFeedbackResponse.find(query)
        .populate('programId', 'title')
        .sort({ submittedAt: -1 });

    let csv = `Submitted At,Program,Name,Email,Feedback,Inspire Code\n`;

    feedbacks.forEach(f => {
        const row = [
            f.submittedAt ? f.submittedAt.toISOString() : '',
            `"${f.programId?.title || 'Unknown'}"`,
            `"${f.name}"`,
            `"${f.email}"`,
            `"${f.feedback.replace(/"/g, '""')}"`,
            `"${f.inspireId}"`
        ];
        csv += row.join(',') + '\n';
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('student-feedbacks.csv');
    res.send(csv);
});

module.exports = {
    createFeedback,
    getAdminFeedbacks,
    getFeedbackById,
    updateFeedback,
    publishFeedback,
    unpublishFeedback,
    deleteFeedback,
    getMyFeedbacks,
    getFeedbackForSubmission,
    submitFeedback,
    exportFeedbackResponses,
    getPendingDefaultFeedbacks,
    submitDefaultFeedback,
    submitPublicFeedback,
    getAllDefaultFeedbacks, // Added
    exportAllDefaultFeedbacks // Added
};
