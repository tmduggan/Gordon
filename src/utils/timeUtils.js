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
export function getDefaultTimeSegment(timezone = 'America/New_York') {
    const now = new Date();
    const options = { timeZone: timezone, hour: 'numeric', hour12: false };
    const hour = parseInt(now.toLocaleString('en-US', options), 10);
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

export const formatIdTimestamp = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day}-${hours}:${minutes}:${seconds}`;
};

/**
 * Parses an ISO 8601 string into its constituent date and time parts for display.
 * @param {string} isoString - The timestamp string from Firestore.
 * @returns {object} An object with date and time strings, e.g., { date: '2025-06-21', time: '19:00' }.
 */
export const parseTimestamp = (isoString) => {
  if (!isoString) return { date: '', time: '' };
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
};

/**
 * Formats a date string (YYYY-MM-DD) for display in MM/DD/YYYY format.
 * @param {string} dateString - The date string in YYYY-MM-DD format.
 * @returns {string} The date formatted as MM/DD/YYYY.
 */
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${month}/${day}/${year}`;
};

export const groupAndEnrichLogs = (logs, exercises) => {
    if (!logs || !exercises || !logs.length || !exercises.length) return {};

    const enriched = logs.map(log => {
        const exerciseDetails = exercises.find(ex => ex.id === log.exerciseId);
        return {
            ...log,
            exerciseName: exerciseDetails?.name || 'Unknown Exercise',
            category: exerciseDetails?.category || 'Unknown',
            score: log.score || 0,
        };
    });

    return enriched.reduce((acc, log) => {
        const logDate = new Date(log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp);
        const dateKey = logDate.toDateString();

        if (!acc[dateKey]) {
            acc[dateKey] = { logs: [], totalDuration: 0, segments: {} };
        }
        acc[dateKey].logs.push(log);
        acc[dateKey].totalDuration += log.duration || 0;
        
        const segment = getTimeSegment(logDate);
        if (!acc[dateKey].segments[segment]) {
            acc[dateKey].segments[segment] = { logs: [], totalDuration: 0 };
        }
        acc[dateKey].segments[segment].logs.push(log);
        acc[dateKey].segments[segment].totalDuration += log.duration || 0;
        
        return acc;
    }, {});
}; 