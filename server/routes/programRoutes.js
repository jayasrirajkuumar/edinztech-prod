const express = require('express');
const router = express.Router();
const {
    getPrograms,
    getProgramById,
    createProgram,
    updateProgram,
    deleteProgram,
    exportPrograms,
    toggleFeedbackStatus,
    uploadBannerImage // Import
} = require('../controllers/programController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const Program = require('../models/Program');

router.get('/export', protect, admin, exportPrograms); // Add Export Route

router.route('/')
    .get(getPrograms)
    .post(protect, admin, createProgram);

router.patch('/:id/toggle-feedback', protect, admin, toggleFeedbackStatus); // Added

router.route('/:id')
    .get(getProgramById)
    .put(protect, admin, updateProgram)
    .delete(protect, admin, deleteProgram);

// Upload Banner Route
router.post('/:id/upload-banner', protect, admin, upload.single('banner'), uploadBannerImage);

// Upload Template Route (Specific)
// Upload Template Route (Specific)
router.post('/:id/upload-template', protect, admin, upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No file received. Check file size or type.');
        }

        const program = await Program.findById(req.params.id);

        if (program) {
            // Determine which template to update based on some logic, or default to certificate
            // Since this is specific to "Certificate Template" usually
            // We'll update certificateTemplate by default.
            // If we need distincion, we can check req.body.type if frontend sends it.

            const filePath = `uploads/${req.file.filename}`;
            program.certificateTemplate = filePath;

            // Should we also update offerLetterTemplate if it's an offer letter?
            // User specifically asked about "certificate template".
            // Let's just update certificateTemplate.

            await program.save();

            res.send({
                message: 'File Uploaded and Saved',
                path: filePath
            });
        } else {
            res.status(404).json({ message: 'Program not found' });
        }
    } catch (error) {
        console.error("Upload Error Details:", error);
        res.status(500).json({ message: 'Upload Failed: ' + error.message });
    }
});

module.exports = router;
