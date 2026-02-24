import { apiFetch } from '../../shared/api/client';
import type { UserRole } from '../auth/api';

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  watchedCount: number;
  likedCount: number;
  dictionaryWordsCount: number;
  exercisesCompletedCount: number;
  learnedWordsCount: number;
  currentStreakDays: number;
  lastSeenAt?: string | null;
};

export type AdminUsersSummary = {
  totalUsers: number;
  activeToday: number;
  activeWeek: number;
  activeMonth: number;
};

export type AdminUsersResponse = {
  items: AdminUser[];
  summary: AdminUsersSummary;
  total: number;
  page: number;
  totalPages: number;
};

type ListParams = {
  page: number;
  limit: number;
  search?: string;
};

export type AdminUserActivityItem = {
  date: string;
  didLogin: boolean;
  videosWatched: number;
  likesGiven: number;
  exercisesCompleted: number;
  wordsAdded: number;
  wordsSearched: number;
  phrasesAdded: number;
};

export type AdminUserActivityResponse = {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
  };
  days: number;
  items: AdminUserActivityItem[];
};

const adminHeaders = (role?: UserRole | null): Record<string, string> => {
  if (!role) return {};
  return { 'x-user-role': role };
};

export const usersAdminApi = {
  getUsers(params: ListParams, role?: UserRole | null) {
    const query = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });
    if (params.search?.trim()) {
      query.set('search', params.search.trim());
    }
    return apiFetch<AdminUsersResponse>(`admin/users?${query.toString()}`, {
      headers: adminHeaders(role),
    });
  },

  getUserActivity(userId: string, days = 60, role?: UserRole | null) {
    const query = new URLSearchParams({
      days: String(days),
    });
    return apiFetch<AdminUserActivityResponse>(
      `admin/users/${userId}/activity?${query.toString()}`,
      {
        headers: adminHeaders(role),
      },
    );
  },

  updateUserRole(id: string, nextRole: UserRole, role?: UserRole | null) {
    return apiFetch<void>(`admin/users/${id}/role`, {
      method: 'PATCH',
      headers: adminHeaders(role),
      body: { role: nextRole },
    });
  },
};
