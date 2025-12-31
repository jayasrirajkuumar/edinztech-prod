const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const asyncHandler = require('express-async-handler');

// @desc    Get all available templates (Strictly 2desh + APPROVED)
// @route   GET /api/admin/whatsapp/templates
// @access  Private/Admin
const getTemplates = asyncHandler(async (req, res) => {
    // PROD: Filter only 2desh Approved templates
    // DEV/DEBUG: If you need to see legacy, check DB directly.
    const templates = await WhatsAppTemplate.find({
        provider: '2desh',
        status: { $in: ['APPROVED', 'Approved', 'Active'] } // Allow variants
    }).select('name description variables _id status channel');

    res.json(templates);
});



// @desc    Create/Register a new template
// @route   POST /api/admin/whatsapp/templates
// @access  Private/Admin
const registerTemplate = asyncHandler(async (req, res) => {
    // This allows manual creation for overrides or testing
    const { name, description, variables, bodyPreview } = req.body;

    const template = await WhatsAppTemplate.create({
        name,
        description,
        variables,
        bodyPreview,
        provider: '2desh', // Manual = 2desh (Trusted/Approved)
        status: 'APPROVED',
        channel: 'Inspire Softech'
    });

    res.status(201).json(template);
});

module.exports = {
    getTemplates,
    registerTemplate
};
