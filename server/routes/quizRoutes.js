const express = require('express');
const router = express.Router();
const {
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
    getQuizAttempt, // Added
    getQuizById
} = require('../controllers/quizController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // Import upload middleware

router.post('/upload', protect, admin, upload.single('image'), uploadQuizImage); // Image Upload
router.get('/:id/reports', protect, admin, getQuizReports); // Get Reports
router.get('/attempt/:id', protect, admin, getQuizAttempt); // New Route for Single Attempt Detail
router.get('/detail/:id', protect, admin, getQuizById); // Get Single Quiz for Edit

router.post('/', protect, admin, createQuiz);
router.get('/all', protect, admin, getAllQuizzes); // Admin route to get all
router.get('/my-quizzes', protect, getStudentQuizzes); // Specific path before param route
router.get('/:programId', protect, getQuizzesByProgram);
router.patch('/:id', protect, admin, updateQuiz);
router.delete('/:id', protect, admin, deleteQuiz);
router.patch('/:id/publish', protect, admin, publishQuiz);
router.patch('/:id/unpublish', protect, admin, unpublishQuiz);
router.post('/:id/attempt', protect, attemptQuiz);

module.exports = router;
