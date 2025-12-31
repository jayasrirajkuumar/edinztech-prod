const mongoose = require('mongoose');

const enrollmentSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    userCode: {
        type: String, // Denormalized for analytics/certificates
        sparse: true
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Program'
    },
    programType: {
        type: String,
        enum: ['Course', 'Internship', 'Workshop', 'Project']
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'dropped'],
        default: 'active'
    },
    validUntil: {
        type: Date
    },
    progressPercent: {
        type: Number,
        default: 0
    },
    source: {
        type: String,
        enum: ['razorpay', 'invite', 'admin', 'free'],
        default: 'razorpay'
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },

    // MANDATORY CERTIFICATE LOGIC
    certificateStatus: {
        type: String,
        enum: ["NOT_PUBLISHED", "PUBLISHED"],
        default: "NOT_PUBLISHED"
    },
    certificateId: {
        type: String,
        unique: true,
        sparse: true // Allow multiple nulls
    },
    certificateIssuedAt: {
        type: Date,
        default: null
    },
    offerLetterStatus: {
        type: String,
        enum: ["NOT_ISSUED", "ISSUED"],
        default: "NOT_ISSUED"
    }
}, {
    timestamps: true
});

// Prevent duplicate enrollment
enrollmentSchema.index({ user: 1, program: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
module.exports = Enrollment;
