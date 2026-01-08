import { apiFetch } from '../../shared/api/client';

export type StreakResponse = {
  streakDays: number;
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
};
