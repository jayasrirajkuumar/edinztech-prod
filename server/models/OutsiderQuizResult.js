const mongoose = require('mongoose');

const outsiderQuizResultSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'OutsiderQuiz', required: true },
    studentName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    college: { type: String },
    organization: { type: String }, // Alternative to college if needed

    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    maxScore: { type: Number, required: true },

    // Certificate Details
    certificateId: { type: String }, // Generated Certificate ID (e.g. QUIZ-12345)
    certificateUrl: { type: String }, // Path to stored PDF if we save it

    submittedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Index for verifying duplicates if we want to restrict attempts (optional)
// outsiderQuizResultSchema.index({ quizId: 1, email: 1 }, { unique: false }); 

module.exports = mongoose.model('OutsiderQuizResult', outsiderQuizResultSchema);
