import { apiFetch } from "../../shared/api/client";

export type PublicGameSnippet = {
  id: string;
  phrase: string;
  translation: string | null;
  contentId: number;
  startSeconds: number;
  endSeconds: number;
  videoUrl: string | null;
  videoName: string | null;
};

export type PublicGameSnippetGame = PublicGameSnippet & {
  wordCount: number;
  wordCountOptions: number[];
  translationOptions: string[];
};

export const publicGameSnippetsApi = {
  list(limit = 20) {
    const params = new URLSearchParams();
    if (limit > 0) params.append("limit", limit.toString());
    return apiFetch<{ items: PublicGameSnippet[] }>(
      `game-snippets?${params.toString()}`
    );
  },
  listGame({ limit = 20, minWords = 1 }: { limit?: number; minWords?: number }) {
    const params = new URLSearchParams();
    if (limit > 0) params.append("limit", limit.toString());
    if (minWords > 0) params.append("minWords", minWords.toString());
    return apiFetch<{ items: PublicGameSnippetGame[] }>(
      `game-snippets/game?${params.toString()}`
    );
  },
};
