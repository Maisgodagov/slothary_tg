import { apiFetch } from "../../shared/api/client";
import type { UserRole } from "../auth/api";
import type { AudioPhraseLevelDetail } from "./api";

export type AudioPhraseLevelAdminListItem = {
  id: string;
  order: number;
  xpReward: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  snippetCount: number;
};

export type AudioPhraseSnippetAdminItem = {
  id: string;
  phrase: string;
  translation: string | null;
  contentId: number;
  startSeconds: number;
  endSeconds: number;
  videoUrl: string | null;
  videoName: string | null;
  levelOrders: number[];
};

const adminHeaders = (role?: UserRole | null): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (role) headers["x-user-role"] = role;
  return headers;
};

export const audioPhraseLevelsAdminApi = {
  list(role?: UserRole | null) {
    return apiFetch<{ items: AudioPhraseLevelAdminListItem[] }>(
      "admin/audio-phrase-levels",
      {
        headers: adminHeaders(role),
      }
    );
  },
  getById(id: string, role?: UserRole | null) {
    return apiFetch<AudioPhraseLevelDetail>(`admin/audio-phrase-levels/${id}`, {
      headers: adminHeaders(role),
    });
  },
  create(
    payload: {
      order: number;
      xpReward: number;
      isActive?: boolean;
      snippetIds: string[];
    },
    role?: UserRole | null
  ) {
    return apiFetch<AudioPhraseLevelDetail>("admin/audio-phrase-levels", {
      method: "POST",
      headers: adminHeaders(role),
      body: payload,
    });
  },
  update(
    id: string,
    payload: {
      order?: number;
      xpReward?: number;
      isActive?: boolean;
      snippetIds?: string[];
    },
    role?: UserRole | null
  ) {
    return apiFetch<AudioPhraseLevelDetail>(`admin/audio-phrase-levels/${id}`, {
      method: "PATCH",
      headers: adminHeaders(role),
      body: payload,
    });
  },
  remove(id: string, role?: UserRole | null) {
    return apiFetch<void>(`admin/audio-phrase-levels/${id}`, {
      method: "DELETE",
      headers: adminHeaders(role),
    });
  },
  listSnippets(role?: UserRole | null) {
    return apiFetch<{ items: AudioPhraseSnippetAdminItem[] }>(
      "admin/audio-phrase-levels/snippets",
      {
        headers: adminHeaders(role),
      }
    );
  },
};
