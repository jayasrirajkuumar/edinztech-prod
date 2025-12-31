const express = require('express');
const router = express.Router();
const {
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
    getPendingDefaultFeedbacks, // Added
    submitDefaultFeedback, // Added
    submitPublicFeedback,
    getAllDefaultFeedbacks, // Added
    exportAllDefaultFeedbacks // Added
} = require('../controllers/feedbackController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Student Routes
router.get('/me', protect, getMyFeedbacks);
router.get('/me/default-pending', protect, getPendingDefaultFeedbacks); // Added
router.post('/me/default', protect, submitDefaultFeedback); // Added
router.get('/me/:id', protect, getFeedbackForSubmission);
router.post('/me/:id', protect, submitFeedback);

// Public Routes
router.post('/public', submitPublicFeedback);

// Admin Routes
router.get('/admin/default', protect, admin, getAllDefaultFeedbacks); // Added
router.get('/admin/default/export', protect, admin, exportAllDefaultFeedbacks); // Added
router.post('/admin', protect, admin, createFeedback);
router.get('/admin', protect, admin, getAdminFeedbacks);
router.get('/admin/:id', protect, admin, getFeedbackById);
router.put('/admin/:id', protect, admin, updateFeedback);
router.delete('/admin/:id', protect, admin, deleteFeedback);
router.patch('/admin/:id/publish', protect, admin, publishFeedback);
router.patch('/admin/:id/unpublish', protect, admin, unpublishFeedback);
router.get('/admin/:id/export', protect, admin, exportFeedbackResponses);

module.exports = router;
