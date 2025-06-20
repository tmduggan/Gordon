// Define a list of standard time zones
export const timeZoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'America/Phoenix', label: 'Arizona' },
    { value: 'America/Anchorage', label: 'Alaska' },
    { value: 'Pacific/Honolulu', label: 'Hawaii' },
    { value: 'UTC', label: 'UTC' },
    // Add more as needed
];

// Helper function to determine time segment
export const getTimeSegment = (date) => {
    const hours = date.getHours();
    if (hours >= 0 && hours < 9) return "Morning";
    if (hours >= 9 && hours < 16) return "Midday";
    return "Evening";
};

// Helper to get current time segment in Eastern US time
export function getDefaultTimeSegment() {
    const now = new Date();
    // Convert to Eastern Time (America/New_York)
    const options = { timeZone: 'America/New_York', hour: 'numeric', hour12: false };
    const hour = parseInt(now.toLocaleString('en-US', options));
    if (hour >= 0 && hour < 9) return 'Morning';
    if (hour >= 9 && hour < 16) return 'Midday';
    return 'Evening';
}

// Add helper functions for time format conversion
export const formatTimeForDisplay = (hours, minutes) => {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
};

export const parseTimeFromDisplay = (displayTime) => {
    const [time, period] = displayTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let parsedHours = hours;
    if (period === 'PM' && hours !== 12) parsedHours += 12;
    if (period === 'AM' && hours === 12) parsedHours = 0;
    return { hours: parsedHours, minutes };
};

export const get24Hour = (hour12, ampm) => {
    let h = parseInt(hour12, 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h;
};

export const formatTimestampLocal = (dateStr, hour12, minute, ampm) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const hour24 = get24Hour(hour12, ampm);

    // Create a date object using the user's local timezone, which is the environment's default.
    // The month is 0-indexed in the JS Date constructor.
    const localDate = new Date(year, month - 1, day, hour24, minute, 0);

    // .toISOString() converts the date to a string in UTC (Z-time).
    // This ensures all timestamps are stored in a consistent, absolute format.
    return localDate.toISOString();
}; 