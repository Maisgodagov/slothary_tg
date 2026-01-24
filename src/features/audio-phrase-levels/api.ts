import { apiFetch } from "../../shared/api/client";

export type AudioPhraseLevelProgress = {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  completedAt: string | null;
};

export type AudioPhraseLevelListItem = {
  id: string;
  order: number;
  xpReward: number;
  isActive: boolean;
  snippetCount: number;
  progress: AudioPhraseLevelProgress | null;
};

export type AudioPhraseLevelSnippet = {
  id: string;
  phrase: string;
  translation: string | null;
  contentId: number;
  startSeconds: number;
  endSeconds: number;
  videoUrl: string | null;
  videoName: string | null;
};

export type AudioPhraseLevelDetail = {
  id: string;
  order: number;
  xpReward: number;
  isActive: boolean;
  levelSnippets: {
    id: string;
    order: number | null;
    snippet: AudioPhraseLevelSnippet;
  }[];
};

export type AudioPhraseLevelProgressRecord = {
  snippetId: string;
  exerciseType: "MISSING" | "ASSEMBLE" | "ODDWORD" | "TRANSLATE";
  isCorrect: boolean;
};

export type AudioPhraseLevelProgressResponse = {
  completed: boolean;
  xpReward: number;
};

const buildHeaders = (userId?: string | null) => {
  const headers: Record<string, string> = {};
  if (userId) headers["x-user-id"] = userId;
  return headers;
};

export const audioPhraseLevelsApi = {
  list(userId?: string | null) {
    return apiFetch<{ items: AudioPhraseLevelListItem[] }>(
      "audio-phrase-levels",
      {
        headers: buildHeaders(userId),
      }
    );
  },
  getLevel(id: string, userId?: string | null) {
    return apiFetch<AudioPhraseLevelDetail>(`audio-phrase-levels/${id}`, {
      headers: buildHeaders(userId),
    });
  },
  recordProgress(id: string, payload: AudioPhraseLevelProgressRecord, userId?: string | null) {
    return apiFetch<AudioPhraseLevelProgressResponse>(
      `audio-phrase-levels/${id}/progress`,
      {
        method: "POST",
        headers: buildHeaders(userId),
        body: payload,
      }
    );
  },
};
