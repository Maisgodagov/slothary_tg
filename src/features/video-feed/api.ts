import { apiFetch } from '../../shared/api/client';
import type { VideoFeedResponse } from './types';

const buildHeaders = (userId?: string | null, role?: string | null) => {
  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;
  if (role) headers['x-user-role'] = role;
  return headers;
};

export const videoFeedApi = {
  getFeed(userId?: string | null, options: { cursor?: string | null; limit?: number; role?: string | null } = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    const query = params.toString();
    const endpoint = query ? `video-learning/feed?${query}` : 'video-learning/feed';

    return apiFetch<VideoFeedResponse>(endpoint, {
      headers: buildHeaders(userId, options.role),
    });
  },
  getContent(userId: string | null | undefined, contentId: string, role?: string | null) {
    return apiFetch<import('./types').VideoContent>(`video-learning/${contentId}`, {
      headers: buildHeaders(userId ?? undefined, role),
    });
  },
  updateLike(userId: string, contentId: string, like: boolean, role?: string | null) {
    return apiFetch<{ likesCount: number; isLiked: boolean }>(`video-learning/${contentId}/like`, {
      method: 'POST',
      headers: buildHeaders(userId, role),
      body: { like },
    });
  },
};
