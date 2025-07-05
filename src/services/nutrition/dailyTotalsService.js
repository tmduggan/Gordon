import { getFoodMacros } from '../../utils/dataUtils';

/**
 * Calculate daily totals for food logs
 * @param {Object} logsArr - Object containing food logs
 * @param {Function} getFoodById - Function to get food by ID
 * @returns {Object} Daily totals for calories, fat, carbs, protein, fiber
 */
export function calculateDailyTotals(logsArr, getFoodById) {
  const totals = { calories: 0, fat: 0, carbs: 0, protein: 0, fiber: 0 };
  const allLogs = Object.values(logsArr).flat();

  allLogs.forEach((log) => {
    const food = getFoodById(log.foodId);
    if (food) {
      const foodMacros = getFoodMacros(food);
      totals.calories += (foodMacros.calories || 0) * log.serving;
      totals.fat += (foodMacros.fat || 0) * log.serving;
      totals.carbs += (foodMacros.carbs || 0) * log.serving;
      totals.protein += (foodMacros.protein || 0) * log.serving;
      totals.fiber += (foodMacros.fiber || 0) * log.serving;
    }
  });
  return totals;
}

/**
 * Group logs by date for display purposes
 * @param {Array} logs - Array of log objects
 * @param {Function} formatDate - Function to format dates
 * @returns {Object} Logs grouped by date
 */
export function groupLogsByDate(logs, formatDate) {
  return logs.reduce((acc, log) => {
    const dateKey = formatDate(new Date(log.timestamp));
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(log);
    return acc;
  }, {});
}
