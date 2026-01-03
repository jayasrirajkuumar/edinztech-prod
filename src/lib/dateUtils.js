export const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    // Use en-GB locale for DD/MM/YYYY format
    // Force IST
    return date.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kolkata',
        ...options
    });
};

export const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    // DD/MM/YYYY, hh:mm AM/PM
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    }).toUpperCase(); // AM/PM uppercase
};

export const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    }).toUpperCase();
};
