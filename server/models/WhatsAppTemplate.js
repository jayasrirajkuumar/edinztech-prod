const mongoose = require('mongoose');

const whatsAppTemplateSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        description: "The exact template name from 2desh/WhatsApp"
    },
    description: {
        type: String,
        description: "Admin-facing description of what this template says"
    },
    variables: [{
        type: String,
        description: "List of variable placeholders e.g., ['1', '2'] or names ['student_name']"
    }],
    provider: {
        type: String,
        enum: ['legacy', '2desh'],
        default: 'legacy',
        description: "Source of the template"
    },
    channel: {
        type: String,
        description: "Channel name (e.g. Inspire Softech)"
    },
    externalId: {
        type: String,
        description: "Unique ID from 2desh/Meta"
    },
    status: {
        type: String,
        default: 'Active',
        description: "Status from provider (APPROVED, PENDING) or internal (Active)"
    },
    providerTemplateId: {
        type: String,
        description: "Optional ID if provider uses ID instead of name"
    },
    bodyPreview: {
        type: String,
        description: "Preview of the message text for admin UI only"
    }
}, {
    timestamps: true
});

const WhatsAppTemplate = mongoose.model('WhatsAppTemplate', whatsAppTemplateSchema);
module.exports = WhatsAppTemplate;
