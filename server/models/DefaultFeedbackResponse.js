const mongoose = require('mongoose');

const defaultFeedbackResponseSchema = mongoose.Schema({
    programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    inspireId: { type: String, default: 'N/A' },
    name: { type: String, required: true },
    organization: { type: String },
    email: { type: String, required: true },
    mobile: { type: String },
    place: { type: String },
    state: { type: String },
    feedback: { type: String, required: true },

    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// One response per program per user
defaultFeedbackResponseSchema.index({ programId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('DefaultFeedbackResponse', defaultFeedbackResponseSchema);
