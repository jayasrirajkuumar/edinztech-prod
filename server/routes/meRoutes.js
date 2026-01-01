const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getDashboard } = require('../controllers/dashboardController');

const { getMyEnrollments, getProgramProgress, updateMyProfile } = require('../controllers/meController');
const { getMyQuizzes, getMyQuiz, submitQuizAttempt } = require('../controllers/meQuizController');
const { getMyFeedbacks, getMyFeedback } = require('../controllers/meFeedbackController');


router.use(protect); // All /me routes are protected

// Dashboard
router.get('/dashboard', getDashboard);
router.put('/profile', updateMyProfile);

// Quizzes
router.get('/quizzes', getMyQuizzes);
router.get('/quizzes/:id', getMyQuiz);
router.post('/quizzes/:id/submit', submitQuizAttempt);

// Feedbacks
router.get('/feedbacks', getMyFeedbacks);
router.get('/feedbacks/:id', getMyFeedback);

// Enrollments
router.get('/enrollments', getMyEnrollments);
router.get('/program/:programId/progress', getProgramProgress);

module.exports = router;
