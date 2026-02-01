const express = require('express');
const router = express.Router();
const { getGallery, addGalleryItem, deleteGalleryItem } = require('../controllers/galleryController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // Assuming this exists, based on other uploads

// Public Route
router.get('/', getGallery);

// Admin Routes
router.post('/', protect, admin, upload.single('image'), addGalleryItem);
router.delete('/:id', protect, admin, deleteGalleryItem);

module.exports = router;
