const express = require('express');
const router = express.Router();
const { authUser, authAdmin, getUserProfile, forgotPassword, checkUserExistence } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/login', authUser);
router.post('/admin/login', authAdmin);
router.get('/me', protect, getUserProfile);
router.post('/forgot-password', forgotPassword);
router.post('/check-user', checkUserExistence);

module.exports = router;
