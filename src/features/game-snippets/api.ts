import { apiFetch } from "../../shared/api/client";
import type { UserRole } from "../auth/api";

export type GameSnippet = {
  id: string;
  phrase: string;
  translation: string | null;
  contentId: number;
  startSeconds: number;
  endSeconds: number;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  videoUrl: string | null;
  videoName: string | null;
};

const adminHeaders = (role?: UserRole | null): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (role) headers["x-user-role"] = role;
  return headers;
};

export const gameSnippetsApi = {
  getById(id: string, role?: UserRole | null) {
    return apiFetch<GameSnippet>(`admin/game-snippets/${id}`, {
      headers: adminHeaders(role),
    });
  },
  list(
    params?: { approved?: boolean; limit?: number; offset?: number },
    role?: UserRole | null
  ) {
    const searchParams = new URLSearchParams();
    if (params?.approved !== undefined) {
      searchParams.append("approved", String(params.approved));
    }
    if (typeof params?.limit === "number") {
      searchParams.append("limit", String(params.limit));
    }
    if (typeof params?.offset === "number") {
      searchParams.append("offset", String(params.offset));
    }
    const suffix = searchParams.toString();
    return apiFetch<{ items: GameSnippet[]; total: number }>(
      `admin/game-snippets${suffix ? `?${suffix}` : ""}`,
      {
        headers: adminHeaders(role),
      }
    );
  },
  create(
    payload: {
      phrase: string;
      translation?: string | null;
      contentId: number;
      startSeconds: number;
      endSeconds: number;
    },
    role?: UserRole | null
  ) {
    return apiFetch<GameSnippet>("admin/game-snippets", {
      method: "POST",
      headers: adminHeaders(role),
      body: payload,
    });
  },
  update(
    id: string,
    payload: {
      phrase?: string;
      translation?: string | null;
      startSeconds?: number;
      endSeconds?: number;
      isActive?: boolean;
      isApproved?: boolean;
    },
    role?: UserRole | null
  ) {
    return apiFetch<GameSnippet>(`admin/game-snippets/${id}`, {
      method: "PATCH",
      headers: adminHeaders(role),
      body: payload,
    });
  },
  remove(id: string, role?: UserRole | null) {
    return apiFetch<void>(`admin/game-snippets/${id}`, {
      method: "DELETE",
      headers: adminHeaders(role),
    });
  },
};
