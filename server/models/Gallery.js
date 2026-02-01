const mongoose = require('mongoose');

const gallerySchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Gallery = mongoose.model('Gallery', gallerySchema);

module.exports = Gallery;
