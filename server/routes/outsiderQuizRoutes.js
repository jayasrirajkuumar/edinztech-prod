const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
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
} = require('../controllers/outsiderQuizController');

// Public Routes
router.get('/public/:id', getPublicQuiz);
router.post('/public/:id/submit', attemptPublicQuiz); // Aligned to /submit

// Admin Routes
router.post('/admin', protect, admin, createOutsiderQuiz);
router.get('/admin', protect, admin, getAllOutsiderQuizzes);
router.get('/admin/:id', protect, admin, getAdminQuizById);
router.put('/admin/:id', protect, admin, updateOutsiderQuiz);
router.delete('/admin/:id', protect, admin, deleteOutsiderQuiz);
router.get('/admin/:id/results', protect, admin, getOutsiderQuizLeads);

// Template Upload
router.post('/admin/:id/upload-template', protect, admin, upload.single('image'), uploadOutsiderQuizTemplate);

// Duplicate
router.post('/admin/:id/duplicate', protect, admin, duplicateOutsiderQuiz);

// Status Toggle (Optional, can rely on update)
// router.patch('/:id/status', protect, admin, updateQuizStatus);

module.exports = router;
