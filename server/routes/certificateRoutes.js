const express = require('express');
const router = express.Router();
const { getMyCertificates, verifyCertificate, issueCertificate, resolveLegacyQR, verifyNewCertificate, regenerateCertificate, publishSingleCertificate } = require('../controllers/certificateController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/resolve', resolveLegacyQR);
router.get('/new-certificates/verify/:certificateId', verifyNewCertificate); // New Architecture
router.get('/me', protect, getMyCertificates);
router.get('/verify', verifyCertificate); // Query param support
router.get('/verify/:code', verifyCertificate);
router.post('/issue', protect, issueCertificate);
router.post('/regenerate/:enrollmentId', protect, admin, regenerateCertificate); // Regenerate Certificate
router.post('/publish/:enrollmentId', protect, admin, publishSingleCertificate); // Publish Single Certificate

module.exports = router;
