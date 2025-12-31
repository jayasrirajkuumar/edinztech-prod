const Enrollment = require('../models/Enrollment');
const Program = require('../models/Program');
const User = require('../models/User');

/**
 * Calculate validUntil date based on program definition.
 * - If Program has fixed endDate -> min(program.endDate, enrolledAt + duration)
 * - Else (Self-paced) -> enrolledAt + 365 days (default) if no duration fields
 */
const computeValidUntil = (program, enrolledAt = new Date()) => {
    // Default duration if not specified: 1 year (365 days)
    const DEFAULT_VALIDITY_DAYS = 365;

    // Logic: 
    // If program has a strict endDate (e.g. Internship/Workshop), access usually ends there.
    // But we might want to give access for a bit longer.
    // Let's assume strict endDate for now if type != Course.

    let validUntil = new Date(enrolledAt);

    if (program.durationDays) {
        validUntil.setDate(validUntil.getDate() + program.durationDays);
    } else {
        validUntil.setDate(validUntil.getDate() + DEFAULT_VALIDITY_DAYS);
    }

    // Cap at program end date if it's a fixed event and arguably 'over'
    // Actually, for LMS, we often want access to continue. 
    // Plan Logic: "If program has fixed endDate -> validUntil = min(program.endDate, enrolledAt + durationDays)"??
    // Actually, if it's a Cohort based course, endDate is real.
    if (program.endDate) {
        // If the calculated validity exceeds the program end date, clamp it?
        // Or strictly disable access after endDate?
        // Let's go with: Access until End Date + 30 days buffer? 
        // Or strictly EndDate as per plan.
        // Plan said: "validUntil = min(program.endDate, enrolledAt + durationDays)"

        // However, if I enroll today and endDate is tomorrow, I get 1 day. Correct.
        if (validUntil > program.endDate) {
            validUntil = program.endDate;
        }
    }

    return validUntil;
};

/**
 * Create or Update Enrollment
 */
const createOrUpdateEnrollment = async ({ userId, programId, source = 'razorpay', paymentId, userCode, programType }) => {
    const program = await Program.findById(programId);
    if (!program) throw new Error('Program not found');

    const typeToSave = programType || program.type;

    // If userCode is not provided, fetch it? 
    // Ideally caller provides it. if not, we can query User if strictly needed, 
    // but for now let's assume caller provides it or we accept it missing if not passed.
    // Better: If missing, fetch user to ensure data integrity.
    let finalUserCode = userCode;
    if (!finalUserCode) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user) finalUserCode = user.userCode;
    }

    const now = new Date();
    const validUntil = computeValidUntil(program, now);

    // Atomic Upsert to prevent race conditions
    const updateFields = {
        status: 'active',
        validUntil: validUntil,
        source: source,
        userCode: finalUserCode,
        programType: typeToSave
    };

    if (paymentId) {
        updateFields.paymentId = paymentId;
    }

    const enrollment = await Enrollment.findOneAndUpdate(
        { user: userId, program: programId },
        {
            $set: updateFields,
            $setOnInsert: {
                enrolledAt: now,
                progressPercent: 0
            }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return enrollment;
};

module.exports = {
    createOrUpdateEnrollment,
    computeValidUntil
};
