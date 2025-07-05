import { beforeEach, describe, expect, it } from 'vitest';
import {
  formatDateForDisplay,
  formatSmartDate,
  formatTimestampLocal,
  groupLogsByDate,
} from '../timeUtils';

describe('Time Utils', () => {
  describe('formatTimestampLocal', () => {
    it('should format timestamp with hour12, minute, and ampm', () => {
      const dateStr = '2024-01-15';
      const result = formatTimestampLocal(dateStr, 14, 30, 'PM');

      expect(result).toBe('2024-01-15T14:30:00');
    });

    it('should handle different hours', () => {
      const dateStr = '2024-01-15';
      const result = formatTimestampLocal(dateStr, 9, 0, 'AM');

      expect(result).toBe('2024-01-15T09:00:00');
    });

    it('should handle midnight', () => {
      const dateStr = '2024-01-15';
      const result = formatTimestampLocal(dateStr, 0, 0, 'AM');

      expect(result).toBe('2024-01-15T00:00:00');
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format date string correctly', () => {
      const result = formatDateForDisplay('2024-01-15');
      expect(result).toBe('January 15, 2024');
    });

    it('should handle empty date string', () => {
      const result = formatDateForDisplay('');
      expect(result).toBe('');
    });

    it('should handle null date string', () => {
      const result = formatDateForDisplay(null);
      expect(result).toBe('');
    });

    it('should handle different months', () => {
      const result = formatDateForDisplay('2024-12-25');
      expect(result).toBe('December 25, 2024');
    });
  });

  describe('groupLogsByDate', () => {
    it('should group logs by date correctly', () => {
      const logs = [
        { timestamp: new Date('2024-01-15T10:00:00') },
        { timestamp: new Date('2024-01-15T14:00:00') },
        { timestamp: new Date('2024-01-16T09:00:00') },
        { timestamp: new Date('2024-01-16T16:00:00') },
      ];

      const result = groupLogsByDate(logs, formatSmartDate);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['Today']).toHaveLength(2); // Assuming today is 2024-01-15
      expect(result['Tomorrow']).toHaveLength(2); // Assuming tomorrow is 2024-01-16
    });

    it('should handle empty logs array', () => {
      const result = groupLogsByDate([], formatSmartDate);
      expect(result).toEqual({});
    });

    it('should handle logs with different date formats', () => {
      const logs = [
        {
          timestamp: {
            seconds: new Date('2024-01-15T10:00:00').getTime() / 1000,
          },
        },
        { timestamp: new Date('2024-01-15T14:00:00') },
      ];

      const result = groupLogsByDate(logs, formatSmartDate);
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

  describe('formatSmartDate', () => {
    it('should return "Today" for current date', () => {
      const today = new Date();
      const result = formatSmartDate(today);
      expect(result).toBe('Today');
    });

    it('should return "Yesterday" for previous date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatSmartDate(yesterday);
      expect(result).toBe('Yesterday');
    });

    it('should return formatted date for other dates', () => {
      const pastDate = new Date('2024-01-10');
      const result = formatSmartDate(pastDate);
      expect(result).toMatch(/January 10, 2024/);
    });

    it('should handle future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const result = formatSmartDate(futureDate);
      expect(result).toMatch(/[A-Za-z]+ \d+, \d{4}/);
    });
  });
});
