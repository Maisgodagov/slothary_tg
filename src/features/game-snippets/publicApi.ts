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

export const publicGameSnippetsApi = {
  list(limit = 20) {
    const params = new URLSearchParams();
    if (limit > 0) params.append("limit", limit.toString());
    return apiFetch<{ items: PublicGameSnippet[] }>(
      `game-snippets?${params.toString()}`
    );
  },
};
