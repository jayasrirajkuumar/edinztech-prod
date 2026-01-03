const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
    question: { type: String, required: true },
    type: {
        type: String,
        enum: ['mcq', 'text', 'file_upload'],
        default: 'mcq',
        required: true
    },
    image: { type: String }, // Optional image URL
    marks: { type: Number, default: 1, required: true },
    options: [{ type: String }], // Optional for text questions (validation in controller/frontend)
    correctOption: {
        type: Number, // Index (0-3) for MCQ
        required: function () { return this.type === 'mcq'; }
    },
    correctAnswer: {
        type: String, // Reference answer for text questions (for admin grading)
        required: function () { return this.type === 'text'; }
    }
});

const quizSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: true
    },
    passingScore: { type: Number, default: 60 },
    questions: [questionSchema],
    status: {
        type: String,
        enum: ['Draft', 'Published'],
        default: 'Draft'
    },
    startTime: { type: Date },
    endTime: { type: Date }
}, {
    timestamps: true
});

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;
