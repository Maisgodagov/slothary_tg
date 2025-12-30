import { apiFetch } from '../../shared/api/client';

export interface UserDictionaryEntry {
  id: string;
  word: string;
  translation: string;
  transcription?: string;
  partOfSpeech?: string;
  audioUrl?: string;
  sourceLang: string;
  targetLang: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDictionaryEntry {
  word: string;
  translation: string;
  transcription?: string;
  partOfSpeech?: string;
  audioUrl?: string;
  sourceLang?: string;
  targetLang?: string;
}

const headersWithUser = (userId?: string | null) => (userId ? { 'x-user-id': userId } : undefined);

export const dictionaryApi = {
  getUserDictionary(userId: string) {
    return apiFetch<UserDictionaryEntry[]>('dictionary', {
      headers: headersWithUser(userId),
    });
  },
  addUserDictionaryEntry(userId: string, payload: CreateUserDictionaryEntry) {
    return apiFetch<UserDictionaryEntry>('dictionary', {
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
};
