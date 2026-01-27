import { apiFetch } from "../../shared/api/client";

export type AudioPhraseLevelSnippet = {
  id: string;
  contentId: number;
  videoName?: string | null;
  videoUrl?: string | null;
  startSeconds: number;
  endSeconds: number;
  phrase: string;
  translation?: string | null;
  content?: {
    videoName?: string | null;
    videoUrl?: string | null;
  } | null;
};

export type AudioPhraseLevelSnippetEntry = {
  snippet: AudioPhraseLevelSnippet;
};

export type AudioPhraseLevel = {
  id: string;
  levelSnippets?: AudioPhraseLevelSnippetEntry[];
};

export type AudioPhraseLevelProgressPayload = {
  snippetId: string;
  exerciseType: "MISSING" | "ASSEMBLE" | "ODDWORD" | "TRANSLATE";
  isCorrect: boolean;
};

export type AudioPhraseLevelProgressResult = {
  completed: boolean;
  xpReward?: number | null;
};

const headersWithUser = (userId?: string | null) =>
  userId ? { "x-user-id": userId } : undefined;

export const audioPhraseLevelsApi = {
  getLevel(levelId: string, userId?: string | null) {
    return apiFetch<{ level: AudioPhraseLevel }>(
      `audio-phrase-levels/${levelId}`,
      {
        headers: headersWithUser(userId),
      }
    ).then((response) => response.level);
  },
  recordProgress(levelId: string, payload: AudioPhraseLevelProgressPayload, userId?: string | null) {
    return apiFetch<AudioPhraseLevelProgressResult>(
      `audio-phrase-levels/${levelId}/progress`,
      {
        method: "POST",
        headers: headersWithUser(userId),
        body: payload,
      }
    );
  },
};
