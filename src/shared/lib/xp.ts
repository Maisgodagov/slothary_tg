export type LevelInfo = {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
};

const BASE_XP = 100;

const levelThreshold = (level: number) => {
  if (level <= 1) return 0;
  const prev = level - 1;
  return BASE_XP * prev * prev;
};

export const getLevelInfo = (xpPoints: number): LevelInfo => {
  const safeXp = Math.max(0, Math.floor(xpPoints || 0));
  const level = Math.max(1, Math.floor(Math.sqrt(safeXp / BASE_XP)) + 1);
  const currentLevelXp = levelThreshold(level);
  const nextLevelXp = levelThreshold(level + 1);
  const span = Math.max(1, nextLevelXp - currentLevelXp);
  const progress = Math.min(1, Math.max(0, (safeXp - currentLevelXp) / span));
  return { level, currentLevelXp, nextLevelXp, progress };
};
