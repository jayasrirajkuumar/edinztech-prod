const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [String], // Array of strings for options
    correctAnswer: { type: String, required: true }, // The correct option string
    marks: { type: Number, default: 1 }
});

const outsiderQuizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    questions: [questionSchema],
    timeLimit: { type: Number, default: 0 }, // In minutes, 0 = no limit
    certificateTemplate: { type: String }, // Path or URL to the certificate template image
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true
});

module.exports = mongoose.model('OutsiderQuiz', outsiderQuizSchema);
