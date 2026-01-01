const mongoose = require('mongoose');

const outsiderQuizAttemptSchema = mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OutsiderQuiz',
        required: true
    },
    userDetails: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        college: { type: String, required: true },
        education: { type: String, required: true },
        registerNumber: { type: String } // Optional
    },
    answers: [{
        questionId: String, // Or index (keeping String for flexibility)
        questionType: String, // 'mcq' or 'text'
        selectedOption: Number, // For MCQ
        textAnswer: String, // For Text
        isCorrect: Boolean,
        marksAwarded: { type: Number, default: 0 }
    }],
    score: { type: Number, required: true },
    totalMaxScore: { type: Number },
    passed: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['Graded', 'Pending Review'],
        default: 'Graded'
    },
    attemptedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const OutsiderQuizAttempt = mongoose.model('OutsiderQuizAttempt', outsiderQuizAttemptSchema);
module.exports = OutsiderQuizAttempt;
