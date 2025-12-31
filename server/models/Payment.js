const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
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
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        required: true,
        default: 'created',
        enum: ['created', 'captured', 'failed']
    }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
