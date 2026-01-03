import { apiFetch } from '../../shared/api/client';
import type { CEFRLevel, SpeechSpeed, VideoContent } from './types';
import type { UserRole } from '../auth/api';

const adminHeaders = (userId?: string | null, role?: UserRole | null) => {
  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;
  if (role) headers['x-user-role'] = role;
  return headers;
};

export const moderationApi = {
  updateCefrLevel(contentId: string, cefrLevel: CEFRLevel, userId?: string | null, role?: UserRole | null) {
    return apiFetch<VideoContent>(`video-learning/${contentId}/moderation/cefr-level`, {
      method: 'PATCH',
      body: { cefrLevel },
      headers: adminHeaders(userId, role),
    });
  },
  updateSpeechSpeed(contentId: string, speechSpeed: SpeechSpeed, userId?: string | null, role?: UserRole | null) {
    return apiFetch<VideoContent>(`video-learning/${contentId}/moderation/speech-speed`, {
      method: 'PATCH',
      body: { speechSpeed },
      headers: adminHeaders(userId, role),
    });
  },
  updateAuthor(contentId: string, author: string, userId?: string | null, role?: UserRole | null) {
    return apiFetch<VideoContent>(`video-learning/${contentId}/moderation/author`, {
      method: 'PATCH',
      body: { author },
      headers: adminHeaders(userId, role),
    });
  },
  updateAdult(contentId: string, isAdultContent: boolean, userId?: string | null, role?: UserRole | null) {
    return apiFetch<VideoContent>(`video-learning/${contentId}/moderation/adult`, {
      method: 'PATCH',
      body: { isAdultContent },
      headers: adminHeaders(userId, role),
    });
  },
  updateModerationStatus(contentId: string, isModerated: boolean, userId?: string | null, role?: UserRole | null) {
    return apiFetch<VideoContent>(`video-learning/${contentId}/moderation/status`, {
      method: 'PATCH',
      body: { isModerated },
      headers: adminHeaders(userId, role),
    });
  },
  deleteVideo(contentId: string, userId?: string | null, role?: UserRole | null) {
    return apiFetch<void>(`video-learning/${contentId}`, {
      method: 'DELETE',
      headers: adminHeaders(userId, role),
    });
  },
  getAuthors(userId?: string | null, role?: UserRole | null) {
    return apiFetch<{ username: string }[]>(`video-learning/authors`, {
      method: 'GET',
      headers: adminHeaders(userId, role),
    });
  },
};
