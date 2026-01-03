import { apiFetch } from '../../shared/api/client';

export type PrecomputedExercise = {
  id: number;
  word_id: number;
  word: string;
  part_of_speech: string | null;
  translations: string;
  direction: 'en-ru' | 'ru-en';
  prompt: string;
  correct_answer: string;
  options: string;
  moderated: number;
};

export type PrecomputedResponse = {
  items: PrecomputedExercise[];
  total: number;
  page: number;
  totalPages: number;
};

type ListParams = {
  page: number;
  limit: number;
  moderated?: 'true' | 'false';
  search?: string;
};

export const adminApi = {
  getPrecomputed({ page, limit, moderated, search }: ListParams) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (moderated) params.append('moderated', moderated);
    if (search) params.append('search', search);

    return apiFetch<PrecomputedResponse>(`admin/exercises?${params.toString()}`);
  },

  updatePrecomputed(
    id: number,
    payload: {
      prompt: string;
      correctAnswer: string;
      options: string[];
      translations: string[];
      partOfSpeech: string | null;
    },
  ) {
    return apiFetch<void>(`admin/exercises/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  deletePrecomputed(id: number) {
    return apiFetch<void>(`admin/exercises/${id}`, { method: 'DELETE' });
  },

  moderatePrecomputed(id: number, moderated: boolean) {
    return apiFetch<void>(`admin/exercises/${id}/moderate`, {
      method: 'PATCH',
      body: { moderated },
    });
  },
};
