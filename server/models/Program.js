const mongoose = require('mongoose');

const programSchema = mongoose.Schema({
    title: { type: String, required: true },
    code: { type: String, unique: true }, // Auto-generated ideal
    description: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['Course', 'Internship', 'Workshop', 'Project']
    },
    mode: {
        type: String,
        required: true,
        enum: ['Online', 'Offline', 'Hybrid']
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    endTime: { type: String },
    extendedDate: { type: Date }, // New Field: Extended Registration Date
    registrationDeadline: { type: Date }, // Last Date to Register

    // Payment
    paymentMode: { type: String, enum: ['Paid', 'Free', 'Invite Only'], default: 'Paid' },
    fee: { type: Number, default: 0 },
    registrationLink: { type: String },

    // Templates (File Paths)
    image: { type: String }, // Implementation uses 'image' generally
    bannerImage: { type: String }, // New Field: Optional Banner/Poster Image
    offerLetterTemplate: { type: String },
    certificateTemplate: { type: String },
    templateType: {
        type: String,
        enum: ['edinz', 'inspire', 'igreen', 'ats'],
        // default: 'edinz' // Removed default to make it optional
    },

    // Certificate Configuration (For Auto-Generation)
    certificateConfig: {
        name: {
            x: { type: Number, default: 50 },
            y: { type: Number, default: 40 },
            fontSize: { type: Number, default: 60 },
            color: { type: String, default: '#000000' }
        },
        registrationNumber: {
            show: { type: Boolean, default: false },
            x: { type: Number, default: 50 },
            y: { type: Number, default: 60 },
            fontSize: { type: Number, default: 20 },
            color: { type: String, default: '#000000' }
        },
        programName: {
            show: { type: Boolean, default: false },
            x: { type: Number, default: 50 },
            y: { type: Number, default: 55 },
            fontSize: { type: Number, default: 40 },
            color: { type: String, default: '#000000' }
        },
        date: {
            show: { type: Boolean, default: true },
            x: { type: Number, default: 75 }, // Adjusted for signature area
            y: { type: Number, default: 78 }, // Adjusted for signature line
            fontSize: { type: Number, default: 16 },
            color: { type: String, default: '#555555' }
        },
        qr: {
            show: { type: Boolean, default: true },
            x: { type: Number, default: 10 },
            y: { type: Number, default: 75 },
            size: { type: Number, default: 150 }
        }
    },

    // Communication (Email)
    emailSubject: { type: String },
    emailBody: { type: String },

    // Legacy WhatsApp (Deprecated)
    whatsappGroupLink: { type: String },
    whatsappMessage: { type: String },

    // New WhatsApp Configuration (Template Based)
    whatsappConfig: {
        onEnrolled: {
            enabled: { type: Boolean, default: false },
            templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppTemplate' },
            variableMapping: {
                type: Map,
                of: String, // Map "1" -> "student.name"
                default: {}
            }
        },
        onCompletion: {
            enabled: { type: Boolean, default: false },
            templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppTemplate' },
            variableMapping: {
                type: Map,
                of: String,
                default: {}
            }
        }
    },

    // Additional Welcome Content
    welcomeEmailContent: { type: String, default: '' },

    isArchived: { type: Boolean, default: false },
    enableFeedback: { type: Boolean, default: false } // Default Feedback Form Toggle
}, {
    timestamps: true
});

const Program = mongoose.model('Program', programSchema);
module.exports = Program;
