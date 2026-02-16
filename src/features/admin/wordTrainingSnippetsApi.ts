import { apiFetch } from '../../shared/api/client';
import type { UserRole } from '../auth/api';

type ModerationFilter = 'all' | 'moderated' | 'unmoderated';

const adminHeaders = (role?: UserRole | null): Record<string, string> => {
  if (!role) return {};
  return { 'x-user-role': role };
};

export type ModerationWordItem = {
  yandexCacheId: number;
  query: string;
  lang: string;
  selectedCount: number;
  isModerated: boolean;
  updatedAt: string;
};

export type ModerationSnippet = {
  contentId: number;
  videoName: string;
  videoUrl: string | null;
  startSeconds: number;
  endSeconds: number;
  matchedText: string;
  contextText: string;
  checked: boolean;
};

export type GeneratedPhraseItem = {
  id: number;
  yandexCacheId: number;
  word: string;
  phraseEn: string;
  phraseRu: string | null;
  phraseAudioUrl: string | null;
  phraseAudioVoice: string | null;
  sourceModel: string | null;
  updatedAt: string;
};

export const wordTrainingSnippetsAdminApi = {
  listWords(params: { limit?: number; offset?: number; filter?: ModerationFilter; search?: string }, role?: UserRole | null) {
    const query = new URLSearchParams();
    if (typeof params.limit === 'number') query.set('limit', String(params.limit));
    if (typeof params.offset === 'number') query.set('offset', String(params.offset));
    if (params.filter) query.set('filter', params.filter);
    if (params.search) query.set('search', params.search);

    return apiFetch<{ items: ModerationWordItem[]; total: number; limit: number; offset: number }>(
      `admin/word-training-snippets/words?${query.toString()}`,
      { headers: adminHeaders(role) },
    );
  },

  getWordSnippets(
    yandexCacheId: number,
    params: { limit?: number; paddingSeconds?: number } = {},
    role?: UserRole | null,
  ) {
    const query = new URLSearchParams();
    if (typeof params.limit === 'number') query.set('limit', String(params.limit));
    if (typeof params.paddingSeconds === 'number') query.set('paddingSeconds', String(params.paddingSeconds));

    return apiFetch<{
      word: { yandexCacheId: number; query: string; lang: string };
      snippets: ModerationSnippet[];
    }>(`admin/word-training-snippets/words/${yandexCacheId}/snippets?${query.toString()}`, {
      headers: adminHeaders(role),
    });
  },

  saveWordSnippets(
    yandexCacheId: number,
    selected: Array<{
      contentId: number;
      startSeconds: number;
      endSeconds: number;
      matchedText?: string | null;
      contextText?: string | null;
    }>,
    role?: UserRole | null,
  ) {
    return apiFetch<{ yandexCacheId: number; selectedCount: number }>(
      `admin/word-training-snippets/words/${yandexCacheId}/snippets`,
      {
        method: 'PUT',
        headers: adminHeaders(role),
        body: { selected },
      },
    );
  },

  listGeneratedPhrases(
    params: { limit?: number; offset?: number; search?: string } = {},
    role?: UserRole | null,
  ) {
    const query = new URLSearchParams();
    if (typeof params.limit === 'number') query.set('limit', String(params.limit));
    if (typeof params.offset === 'number') query.set('offset', String(params.offset));
    if (params.search) query.set('search', params.search);

    return apiFetch<{ items: GeneratedPhraseItem[]; total: number; limit: number; offset: number }>(
      `admin/word-training-snippets/generated-phrases?${query.toString()}`,
      { headers: adminHeaders(role) },
    );
  },
};
