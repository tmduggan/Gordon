interface TimeZone {
  value: string;
  label: string;
  flag: string;
  gmtOffset: string;
}

// List of major time zones with emoji flag, intuitive name, and GMT offset
// Also includes a function to get the current time in each zone

const timeZones: TimeZone[] = [
  {
    value: 'Pacific/Auckland',
    label: 'New Zealand Time',
    flag: '🇳🇿',
    gmtOffset: '+12',
  },
  {
    value: 'Australia/Sydney',
    label: 'Eastern Australia',
    flag: '🇦🇺',
    gmtOffset: '+10',
  },
  {
    value: 'Asia/Tokyo',
    label: 'Japan/Korea Time',
    flag: '🇯🇵',
    gmtOffset: '+9',
  },
  {
    value: 'Asia/Shanghai',
    label: 'China Standard Time',
    flag: '🇨🇳',
    gmtOffset: '+8',
  },
  {
    value: 'Asia/Bangkok',
    label: 'Indochina Time',
    flag: '🇹🇭',
    gmtOffset: '+7',
  },
  {
    value: 'Asia/Kolkata',
    label: 'India Standard Time',
    flag: '🇮🇳',
    gmtOffset: '+5:30',
  },
  {
    value: 'Asia/Dubai',
    label: 'Gulf Standard Time',
    flag: '🇦🇪',
    gmtOffset: '+4',
  },
  { value: 'Europe/Moscow', label: 'Moscow Time', flag: '🇷🇺', gmtOffset: '+3' },
  {
    value: 'Europe/Berlin',
    label: 'Central Europe',
    flag: '🇩🇪',
    gmtOffset: '+1',
  },
  {
    value: 'Europe/London',
    label: 'UK / Ireland Time',
    flag: '🇬🇧',
    gmtOffset: '+0',
  },
  {
    value: 'America/Sao_Paulo',
    label: 'Brazil Time',
    flag: '🇧🇷',
    gmtOffset: '-3',
  },
  {
    value: 'America/Argentina/Buenos_Aires',
    label: 'Argentina Time',
    flag: '🇦🇷',
    gmtOffset: '-3',
  },
  {
    value: 'America/New_York',
    label: 'Eastern Time (ET)',
    flag: '🇺🇸',
    gmtOffset: '-5',
  },
  {
    value: 'America/Chicago',
    label: 'Central Time (CT)',
    flag: '🇺🇸',
    gmtOffset: '-6',
  },
  {
    value: 'America/Denver',
    label: 'Mountain Time (MT)',
    flag: '🇺🇸',
    gmtOffset: '-7',
  },
  {
    value: 'America/Los_Angeles',
    label: 'Pacific Time (PT)',
    flag: '🇺🇸',
    gmtOffset: '-8',
  },
  {
    value: 'America/Anchorage',
    label: 'Alaska Time',
    flag: '🇺🇸',
    gmtOffset: '-9',
  },
  {
    value: 'Pacific/Honolulu',
    label: 'Hawaii Time',
    flag: '🇺🇸',
    gmtOffset: '-10',
  },
  { value: 'UTC', label: 'UTC', flag: '🌍', gmtOffset: '+0' },
];

export function getCurrentTimeInZone(timeZone: string): string {
  try {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone,
    });
  } catch {
    return '';
  }
}

export default timeZones; 