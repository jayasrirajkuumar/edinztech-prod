const express = require('express');
const router = express.Router();
const {
    createQuiz,
    getQuizzes,
    getQuizAdmin,
    updateQuiz,
    getQuizResults,
    getPublicQuiz,
    submitPublicQuiz,
    uploadQuizTemplate
} = require('../controllers/outsiderQuizController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Admin Routes
router.route('/admin')
    .post(protect, admin, createQuiz)
    .get(protect, admin, getQuizzes);

router.get('/admin/leads', protect, admin, require('../controllers/outsiderQuizController').getAllLeads);

router.post('/admin/:id/upload-template', protect, admin, upload.single('image'), uploadQuizTemplate);

router.route('/admin/:id')
    .get(protect, admin, getQuizAdmin)
    .put(protect, admin, updateQuiz);

router.route('/admin/:id/results')
    .get(protect, admin, getQuizResults);

// Public Routes
router.route('/public/:id').get(getPublicQuiz);
router.route('/public/:id/submit').post(submitPublicQuiz);

module.exports = router;
