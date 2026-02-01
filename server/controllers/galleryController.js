const Gallery = require('../models/Gallery');
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');

// @desc    Get all gallery items
// @route   GET /api/gallery
// @access  Public
const getGallery = asyncHandler(async (req, res) => {
    const items = await Gallery.find({}).sort({ createdAt: -1 });
    res.json(items);
});

// @desc    Add new gallery item
// @route   POST /api/gallery
// @access  Private/Admin
const addGalleryItem = asyncHandler(async (req, res) => {
    const { title } = req.body;

    if (!req.file) {
        res.status(400);
        throw new Error('No image file uploaded');
    }

    // Fix: Store relative path 'uploads/filename' instead of absolute system path
    const imageUrl = `uploads/${req.file.filename}`;

    const galleryItem = await Gallery.create({
        title,
        imageUrl,
    });

    res.status(201).json(galleryItem);
});

// @desc    Delete gallery item
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
const deleteGalleryItem = asyncHandler(async (req, res) => {
    const item = await Gallery.findById(req.params.id);

    if (item) {
        // Optional: Delete file from filesystem
        // const filePath = path.join(__dirname, '..', item.imageUrl);
        // if (fs.existsSync(filePath)) {
        //     fs.unlinkSync(filePath);
        // }

        await item.deleteOne();
        res.json({ message: 'Gallery item removed' });
    } else {
        res.status(404);
        throw new Error('Gallery item not found');
    }
});

module.exports = {
    getGallery,
    addGalleryItem,
    deleteGalleryItem,
};
