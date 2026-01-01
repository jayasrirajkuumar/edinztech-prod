const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
    question: { type: String }, // Relaxed
    type: {
        type: String,
        enum: ['mcq', 'text'],
        default: 'mcq'
    },
    image: { type: String },
    marks: { type: Number, default: 1 },
    options: [{ type: String }],
    correctOption: {
        type: Number // Relaxed
    },
    correctAnswer: {
        type: String // Relaxed
    }
});

const outsiderQuizSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    passingScore: { type: Number, default: 60 },
    questions: [questionSchema],
    status: {
        type: String,
        enum: ['Draft', 'Published'],
        default: 'Draft'
    },
    startTime: { type: Date },
    endTime: { type: Date },
    enableCertificates: { type: Boolean, default: false },
    certificateTemplate: { type: String } // Path to uploaded template
}, {
    timestamps: true
});

const OutsiderQuiz = mongoose.model('OutsiderQuiz', outsiderQuizSchema);
module.exports = OutsiderQuiz;
