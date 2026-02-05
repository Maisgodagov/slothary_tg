import { apiFetch } from '../../shared/api/client';

export interface UserDictionaryEntry {
  id: string;
  type: "word" | "phrase";
  word?: string;
  phrase?: string;
  translation: string;
  otherTranslations?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDictionaryEntry {
  query: string;
  lang: 'en' | 'ru';
  word?: string;
  translation?: string;
}

export interface CreateUserPhraseEntry {
  query: string;
  lang: 'en' | 'ru';
}

export interface DictionaryStats {
  learningCount: number;
  knownCount: number;
  viewedCount: number;
}

export interface DictionaryStatsWord {
  id: string;
  query: string;
  lang: 'en' | 'ru';
  word: string;
  translation: string;
  otherTranslations: string[];
  touchesTotal: number | null;
  touchesCorrect: number | null;
  touchesIncorrect: number | null;
}

export interface PhraseTranslationResponse {
  translation: string;
}

const headersWithUser = (userId?: string | null) => (userId ? { 'x-user-id': userId } : undefined);

export const dictionaryApi = {
  getUserDictionary(userId: string) {
    return apiFetch<UserDictionaryEntry[]>('dictionary', {
      headers: headersWithUser(userId),
    });
  },
  getStats(userId: string) {
    return apiFetch<DictionaryStats>('dictionary/stats', {
      headers: headersWithUser(userId),
    });
  },
  getStatsWords(
    userId: string,
    status: 'learning' | 'known' | 'viewed',
    options?: { limit?: number; offset?: number }
  ) {
    const query = new URLSearchParams({ status });
    if (typeof options?.limit === "number") {
      query.set("limit", String(options.limit));
    }
    if (typeof options?.offset === "number") {
      query.set("offset", String(options.offset));
    }
    return apiFetch<{ items: DictionaryStatsWord[] }>(
      `dictionary/stats/words?${query.toString()}`,
      {
        headers: headersWithUser(userId),
      }
    );
  },
  recordView(
    userId: string,
    payload: { query: string; lang: 'en' | 'ru'; word: string; translation: string }
  ) {
    return apiFetch<void>('dictionary/views', {
      method: 'POST',
      headers: headersWithUser(userId),
      body: payload,
    });
  },
  addUserDictionaryEntry(userId: string, payload: CreateUserDictionaryEntry) {
    return apiFetch<UserDictionaryEntry>('dictionary', {
      method: 'POST',
      headers: headersWithUser(userId),
      body: payload,
    });
  },
  addUserPhraseEntry(userId: string, payload: CreateUserPhraseEntry) {
    return apiFetch<UserDictionaryEntry>('dictionary/phrases', {
      method: 'POST',
      headers: headersWithUser(userId),
      body: payload,
    });
  },
  deleteUserDictionaryEntry(userId: string, id: string) {
    return apiFetch<void>(`dictionary/${id}`, {
      method: 'DELETE',
      headers: headersWithUser(userId),
    });
  },
  deleteUserPhraseEntry(userId: string, id: string) {
    return apiFetch<void>(`dictionary/phrases/${id}`, {
      method: 'DELETE',
      headers: headersWithUser(userId),
    });
  },
  translatePhrase(text: string, from: 'en' | 'ru' = 'en', to: 'en' | 'ru' = 'ru') {
    const query = new URLSearchParams({ text, from, to });
    return apiFetch<PhraseTranslationResponse>(`dictionary/translate?${query.toString()}`);
  },
};
