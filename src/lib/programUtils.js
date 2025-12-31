export const getProgramStatus = (program) => {
    if (!program || !program.startDate || !program.endDate) return 'Unknown';

    const now = new Date();
    const startDate = new Date(program.startDate);
    const endDate = new Date(program.endDate);

    if (now < startDate) {
        return 'Upcoming';
    } else if (now >= startDate && now <= endDate) {
        return 'Ongoing';
    } else {
        return 'Completed';
    }
};

export const getRegistrationStatus = (program) => {
    if (!program || !program.startDate) return 'Closed';

    const now = new Date();
    const startDate = new Date(program.startDate);

    // Priority: Explicit Deadline > ValidUntil > EndDate
    const registrationEndDate = program.registrationDeadline
        ? new Date(program.registrationDeadline)
        : (program.endDate ? new Date(program.endDate) : startDate);

    // Check for Extended Status
    // Extended if: deadline exists AND deadline > endDate (original end) AND now > endDate AND now <= deadline
    if (program.registrationDeadline && program.endDate) {
        const originalEnd = new Date(program.endDate);
        if (new Date(program.registrationDeadline) > originalEnd && now > originalEnd && now <= new Date(program.registrationDeadline)) {
            return 'Extended';
        }
    }

    if (now > registrationEndDate) {
        // EDGE CASE FIX: If the program is "Upcoming" (Start Date in future) AND 
        // the calculated deadline (likely EndDate) is in the past (which implies EndDate < StartDate, i.e., invalid data),
        // and NO explicit Registration Deadline was set, we should probably treat it as OPEN to avoid "Upcoming but Closed" UI glitches due to bad data.

        // Only apply this safety net if NO explicit registrationDeadline was provided
        if (!program.registrationDeadline && startDate > now && registrationEndDate < startDate) {
            return 'Open';
        }

        return 'Closed';
    }

    // Check if closing soon (within 7 days of deadline)
    const sevenDaysBefore = new Date(registrationEndDate);
    sevenDaysBefore.setDate(registrationEndDate.getDate() - 7);

    if (now >= sevenDaysBefore) {
        return 'Closing Soon';
    }

    return 'Open';
};

export const isRegistrationOpen = (program) => {
    return getRegistrationStatus(program) !== 'Closed';
};

export const getDurationString = (program) => {
    if (program.duration) return program.duration;

    if (program.startDate && program.endDate) {
        const start = new Date(program.startDate);
        const end = new Date(program.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) return `${diffDays} Days`;
        const months = Math.round(diffDays / 30);
        return `${months} Month${months > 1 ? 's' : ''}`;
    }

    return 'Self-paced';
};
