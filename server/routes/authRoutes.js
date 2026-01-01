const express = require('express');
const router = express.Router();
const { authUser, authAdmin, getUserProfile, forgotPassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/login', authUser);
router.post('/admin/login', authAdmin);
router.get('/me', protect, getUserProfile);
router.post('/forgot-password', forgotPassword);

module.exports = router;
