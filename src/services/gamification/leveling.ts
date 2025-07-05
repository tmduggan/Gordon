// Level calculation, XP for next level, and level title logic

export const LEVEL_CONFIG = {
  baseXP: 1000,
  scalingFactor: 1.15,
  levelTitles: {
    1: 'Pixel Sprite',
    5: 'Arcade Warrior',
    10: 'Retro Champion',
    15: '8-Bit Hero',
    20: 'Console Master',
    25: 'Digital Legend',
    30: 'Virtual Champion',
    35: 'Cyber Warrior',
    40: 'Neon Knight',
    50: 'Quantum Hero',
    75: 'Binary Overlord',
    100: 'Digital Deity',
  },
} as const;

export function calculateXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(LEVEL_CONFIG.baseXP * Math.pow(LEVEL_CONFIG.scalingFactor, level - 1));
}

export function calculateLevelFromXP(totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number; progress: number; xpToNext: number; levelTitle: string } {
  let level = 1;
  while (true) {
    const nextLevelXP = calculateXPForLevel(level + 1);
    if (totalXP < nextLevelXP) break;
    level++;
  }
  const levelStartXP = calculateXPForLevel(level);
  const nextLevelXP = calculateXPForLevel(level + 1);
  const xpInCurrentLevel = totalXP - levelStartXP;
  const xpNeededForLevel = nextLevelXP - levelStartXP;
  const progress = xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 0;
  const xpToNext = nextLevelXP - totalXP;
  return {
    level,
    currentLevelXP: levelStartXP,
    nextLevelXP,
    progress: Math.round(progress * 100) / 100,
    xpToNext,
    levelTitle: LEVEL_CONFIG.levelTitles[level] || `Level ${level}`,
  };
}

export function getLevelTitle(level: number): string {
  // TODO: Implement level title lookup
  return LEVEL_CONFIG.levelTitles[1];
} 