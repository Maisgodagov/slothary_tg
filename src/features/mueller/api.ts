import { apiFetch } from '../../shared/api/client';

export type MuellerEntry = {
  id: number;
  word: string;
  partOfSpeech: string | null;
  translations: string[];
  synonyms?: string[];
};

type LookupParams = {
  word: string;
  lang: 'en' | 'ru';
};

export const muellerApi = {
  lookup(params: LookupParams) {
    const query = new URLSearchParams({
      word: params.word,
      lang: params.lang,
    });
    return apiFetch<MuellerEntry[]>(`mueller/lookup?${query.toString()}`);
  },
};
