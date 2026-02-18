import { apiFetch } from '../../shared/api/client';

export type StreakResponse = {
  streakDays: number;
};

export type XpResponse = {
  xpPoints: number;
};

export type StreakHistoryResponse = {
  dates: string[];
};

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type UpdateLevelResponse = {
  level: CefrLevel;
};

const buildHeaders = (userId?: string | null) => {
  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;
  return headers;
};

export const usersApi = {
  refreshStreak(userId?: string | null) {
    return apiFetch<StreakResponse>('users/streak/refresh', {
      method: 'POST',
      headers: buildHeaders(userId),
      body: { userId },
    });
  },
  addXp(amount: number, userId?: string | null) {
    return apiFetch<XpResponse>('users/xp', {
      method: 'POST',
      headers: buildHeaders(userId),
      body: { amount },
    });
  },
  getStreakHistory(userId?: string | null) {
    return apiFetch<StreakHistoryResponse>('users/streak/history', {
      headers: buildHeaders(userId),
    });
  },
  updateLevel(level: CefrLevel, userId?: string | null) {
    return apiFetch<UpdateLevelResponse>('users/level', {
      method: 'PATCH',
      headers: buildHeaders(userId),
      body: { level },
    });
  },
};
