const asyncHandler = require('express-async-handler');
const Program = require('../models/Program');

// @desc    Get all programs
// @route   GET /api/programs
// @access  Public
const getPrograms = asyncHandler(async (req, res) => {
    // Basic filtering
    const keyword = req.query.keyword ? {
        title: {
            $regex: req.query.keyword,
            $options: 'i',
        },
    } : {};

    // Filter by type if provided (Course, Internship, Workshop)
    const typeFilter = req.query.type ? { type: req.query.type } : {};

    // Filter active/published
    const activeFilter = { isArchived: false };

    // Aggregation pipeline to join enrollments and count them
    const programs = await Program.aggregate([
        { $match: { ...keyword, ...typeFilter, ...activeFilter } },
        {
            $lookup: {
                from: 'enrollments', // collection name in DB (usually lowercase plural)
                localField: '_id',
                foreignField: 'program',
                as: 'enrollmentsData'
            }
        },
        {
            $addFields: {
                enrolledCount: { $size: '$enrollmentsData' },
                publishedCertificatesCount: {
                    $size: {
                        $filter: {
                            input: '$enrollmentsData',
                            as: 'e',
                            cond: { $eq: ['$$e.certificateStatus', 'PUBLISHED'] }
                        }
                    }
                },
                issuedOfferLettersCount: {
                    $size: {
                        $filter: {
                            input: '$enrollmentsData',
                            as: 'e',
                            cond: { $eq: ['$$e.offerLetterStatus', 'ISSUED'] }
                        }
                    }
                }
            }
        },
        {
            $project: {
                enrollmentsData: 0 // Remove heavy array
            }
        },
        { $sort: { createdAt: -1 } }
    ]);
    res.json(programs);
});

// @desc    Get single program
// @route   GET /api/programs/:id
// @access  Public
const getProgramById = asyncHandler(async (req, res) => {
    const program = await Program.findById(req.params.id);

    if (program) {
        res.json(program);
    } else {
        res.status(404);
        throw new Error('Program not found');
    }
});

// @desc    Create a program
// @route   POST /api/admin/programs
// @access  Private/Admin
const createProgram = asyncHandler(async (req, res) => {
    const { title, description, type, code, startDate, endDate, fee, mode, registrationDeadline } = req.body;

    // Check if code exists
    if (code) {
        const programExists = await Program.findOne({ code });
        if (programExists) {
            res.status(400);
            throw new Error('Program with this code already exists');
        }
    }

    const program = new Program({
        ...req.body,
        // user: req.user._id, // if we want to track creator
    });

    const createdProgram = await program.save();
    res.status(201).json(createdProgram);
});

// @desc    Update a program
// @route   PUT /api/admin/programs/:id
// @access  Private/Admin
const updateProgram = asyncHandler(async (req, res) => {
    const program = await Program.findById(req.params.id);

    if (program) {
        // Merge body into program
        Object.assign(program, req.body);

        const updatedProgram = await program.save();
        res.json(updatedProgram);
    } else {
        res.status(404);
        throw new Error('Program not found');
    }
});

// @desc    Delete/Archive a program
// @route   DELETE /api/admin/programs/:id
// @access  Private/Admin
const deleteProgram = asyncHandler(async (req, res) => {
    const program = await Program.findById(req.params.id);

    if (program) {
        program.isArchived = true; // Soft delete
        await program.save();
        res.json({ message: 'Program archived' });
    } else {
        res.status(404);
        throw new Error('Program not found');
    }
});

// @desc    Export Programs to CSV
// @route   GET /api/programs/export
// @access  Private/Admin
const exportPrograms = asyncHandler(async (req, res) => {
    // Reuse filtering logic from getPrograms
    const keyword = req.query.keyword ? {
        title: {
            $regex: req.query.keyword,
            $options: 'i',
        },
    } : {};

    const typeFilter = req.query.type && req.query.type !== 'All' ? { type: req.query.type } : {};

    const programs = await Program.aggregate([
        { $match: { ...keyword, ...typeFilter, isArchived: false } },
        {
            $lookup: {
                from: 'enrollments',
                localField: '_id',
                foreignField: 'program',
                as: 'enrollmentsData'
            }
        },
        {
            $addFields: {
                enrolledCount: { $size: '$enrollmentsData' }
            }
        },
        { $project: { enrollmentsData: 0 } },
        { $sort: { createdAt: -1 } }
    ]);

    // Generate CSV
    let csv = 'Title,Code,Type,Mode,Fee,Enrolled Count,Status,Created At\n';

    programs.forEach(p => {
        const row = [
            `"${p.title.replace(/"/g, '""')}"`,
            `"${p.code || ''}"`,
            p.type,
            p.mode,
            p.fee,
            p.enrolledCount,
            p.isArchived ? 'Archived' : 'Active',
            p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : ''
        ];
        csv += row.join(',') + '\n';
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('programs.csv');
    res.send(csv);
    res.send(csv);
});

// @desc    Toggle Default Feedback Status
// @route   PATCH /api/admin/programs/:id/toggle-feedback
// @access  Private/Admin
// @route   PATCH /api/admin/programs/:id/toggle-feedback
// @access  Private/Admin
const toggleFeedbackStatus = asyncHandler(async (req, res) => {
    console.log(`[DEBUG] Toggle Feedback hit for ID: ${req.params.id}`);
    const program = await Program.findById(req.params.id);

    if (program) {
        console.log(`[DEBUG] Current Status: ${program.isFeedbackEnabled}`);
        program.isFeedbackEnabled = !program.isFeedbackEnabled;
        const updatedProgram = await program.save();
        console.log(`[DEBUG] New Status: ${updatedProgram.isFeedbackEnabled}`);
        res.json(updatedProgram);
    } else {
        console.log(`[DEBUG] Program not found`);
        res.status(404);
        throw new Error('Program not found');
    }
});

module.exports = {
    getPrograms,
    getProgramById,
    createProgram,
    updateProgram,
    deleteProgram,
    exportPrograms,
    toggleFeedbackStatus
};
