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
};

export type AdminUsersResponse = {
  items: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
};

type ListParams = {
  page: number;
  limit: number;
};

const adminHeaders = (role?: UserRole | null) => {
  if (!role) return {};
  return { 'x-user-role': role };
};

export const usersAdminApi = {
  getUsers(params: ListParams, role?: UserRole | null) {
    const query = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });
    return apiFetch<AdminUsersResponse>(`admin/users?${query.toString()}`, {
      headers: adminHeaders(role),
    });
  },

  updateUserRole(id: string, nextRole: UserRole, role?: UserRole | null) {
    return apiFetch<void>(`admin/users/${id}/role`, {
      method: 'PATCH',
      headers: adminHeaders(role),
      body: { role: nextRole },
    });
  },
};
