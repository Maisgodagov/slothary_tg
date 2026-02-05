import { apiFetch } from "../../shared/api/client";

export interface PhraseSnippet {
  id: string;
  contentId: string;
  videoName: string;
  videoUrl: string;
  startSeconds: number;
  endSeconds: number;
  matchedText: string;
  contextText: string;
  phrase: string;
  durationSeconds: number | null;
  audioLevel?: number;
  translationMatchedText?: string;
  translationContextText?: string;
}

export interface PhraseSearchResponse {
  phrase: string;
  returned: number;
  items: PhraseSnippet[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
  pageSize: number;
}

const buildHeaders = (userId?: string | null) => {
  const headers: Record<string, string> = {};
  if (userId) headers["x-user-id"] = userId;
  return headers;
};

export const videoDictionaryApi = {
  searchPhrase({
    phrase,
    limit,
    cursor,
    paddingSeconds,
    sampleSize,
    userId,
    signal,
  }: {
    phrase: string;
    limit?: number;
    cursor?: string | number | null;
    paddingSeconds?: number;
    sampleSize?: number;
    userId?: string | null;
    signal?: AbortSignal;
  }) {
    const params = new URLSearchParams();
    params.append("phrase", phrase);
    if (limit && limit > 0) params.append("limit", limit.toString());
    if (typeof paddingSeconds === "number" && paddingSeconds >= 0) {
      params.append("paddingSeconds", Math.floor(paddingSeconds).toString());
    }
    if (cursor !== undefined && cursor !== null) {
      params.append("cursor", cursor.toString());
    }
    if (typeof sampleSize === "number" && sampleSize > 0) {
      params.append("sampleSize", Math.floor(sampleSize).toString());
    }

    return apiFetch<PhraseSearchResponse>(
      `video-learning/search?${params.toString()}`,
      {
        headers: buildHeaders(userId),
        signal,
      }
    );
  },
};
