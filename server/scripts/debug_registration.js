require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
const Program = require('../models/Program');

// Copied logic from programUtils.js
const getRegistrationStatus = (program) => {
    if (!program || !program.startDate) return 'Closed - No Start Date';

    const now = new Date(); // Use current server time
    const startDate = new Date(program.startDate);

    // Priority: Explicit Deadline > ValidUntil > EndDate
    const registrationEndDate = program.registrationDeadline
        ? new Date(program.registrationDeadline)
        : (program.endDate ? new Date(program.endDate) : startDate);

    console.log('--- Logic Trace ---');
    console.log(`Now: ${now.toISOString()}`);
    console.log(`Start Date: ${startDate.toISOString()}`);
    console.log(`End Date: ${program.endDate ? new Date(program.endDate).toISOString() : 'N/A'}`);
    console.log(`Reg Deadline (Raw): ${program.registrationDeadline}`);
    console.log(`Calculated Reg End Date: ${registrationEndDate.toISOString()}`);

    // Check for Extended Status
    if (program.registrationDeadline && program.endDate) {
        const originalEnd = new Date(program.endDate);
        if (new Date(program.registrationDeadline) > originalEnd && now > originalEnd && now <= new Date(program.registrationDeadline)) {
            return 'Extended';
        }
    }

    if (now > registrationEndDate) {
        console.log('Now > RegEndDate -> Potential Closing');
        // EDGE CASE FIX: If the program is "Upcoming" (Start Date in future) AND 
        // the calculated deadline (likely EndDate OR Explicit Deadline) is in the past (which implies EndDate/Deadline < StartDate, i.e., invalid data),
        // we should probably treat it as OPEN to avoid "Upcoming but Closed" UI glitches due to bad data.

        // Only apply this safety net for future programs
        if (startDate > now && registrationEndDate < startDate) {
            console.log('Edge Case Fix Triggered: Future Start, Past End/Deadline (< Start) -> Open');
            return 'Open';
        }
        return 'Closed';
    }

    const sevenDaysBefore = new Date(registrationEndDate);
    sevenDaysBefore.setDate(registrationEndDate.getDate() - 7);

    if (now >= sevenDaysBefore) {
        return 'Closing Soon';
    }

    return 'Open';
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const programId = '69553662cd9ef1b436942138'; // Note: Ensure this ID is correct. The ID in URL looked generated.
        // If it is NOT an ObjectId, this will fail.
        // The URL 69553662cd9ef1b436942138 is 24 hex chars? 
        // 69... is valid hex but likely a random string from user or generated ID.
        // Let's try to query by ID. If fail, query by title or code if known?
        // Screenshot says "helooo".

        let program;
        if (mongoose.Types.ObjectId.isValid(programId)) {
            program = await Program.findById(programId);
        }

        if (!program) {
            console.log('ID not found or invalid, searching by title "helooo"');
            program = await Program.findOne({ title: /helooo/i });
        }

        if (!program) {
            console.log('Program not found');
            return;
        }

        console.log('Program Found:', program.title);
        console.log('ID:', program._id);

        const status = getRegistrationStatus(program);
        console.log('FINAL STATUS:', status);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
