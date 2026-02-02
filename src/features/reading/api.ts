import { apiFetch } from "../../shared/api/client";
import type { ReadingBook, ReadingPreferences, ReadingProgressPayload } from "./types";

const headersWithUser = (userId?: string | null) =>
  userId ? { "x-user-id": userId } : undefined;

const headersWithUserRole = (userId?: string | null, role?: string | null) => {
  const headers: Record<string, string> = {};
  if (userId) headers["x-user-id"] = userId;
  if (role) headers["x-user-role"] = role;
  return headers;
};

export const readingApi = {
  listBooks(userId?: string | null) {
    return apiFetch<{ items: ReadingBook[] }>("reading/books", {
      headers: headersWithUser(userId),
    });
  },
  getBook(bookId: string, userId?: string | null) {
    return apiFetch<ReadingBook>(`reading/books/${bookId}`, {
      headers: headersWithUser(userId),
    });
  },
  createBook(
    payload: {
      title: string;
      author?: string | null;
      description?: string | null;
      coverUrl?: string | null;
      fileUrl: string;
      language?: string;
      cefrLevel?: string | null;
      wordCount?: number;
      isPublished?: boolean;
    },
    userId?: string | null,
    role?: string | null
  ) {
    return apiFetch<ReadingBook>("reading/books", {
      method: "POST",
      headers: headersWithUserRole(userId, role),
      body: payload,
    });
  },
  uploadBook(
    payload: {
      file: File;
      cefrLevel?: string | null;
    },
    userId?: string | null,
    role?: string | null
  ) {
    const form = new FormData();
    form.append("file", payload.file);
    if (payload.cefrLevel) {
      form.append("cefrLevel", payload.cefrLevel);
    }
    return apiFetch<ReadingBook>("reading/books/upload", {
      method: "POST",
      headers: headersWithUserRole(userId, role),
      body: form,
    });
  },
  updateBook(
    bookId: string,
    payload: {
      title?: string;
      author?: string | null;
      description?: string | null;
      cefrLevel?: string | null;
    },
    userId?: string | null,
    role?: string | null
  ) {
    return apiFetch<ReadingBook>(`reading/books/${bookId}`, {
      method: "PUT",
      headers: headersWithUserRole(userId, role),
      body: payload,
    });
  },
  deleteBook(bookId: string, userId?: string | null, role?: string | null) {
    return apiFetch<void>(`reading/books/${bookId}`, {
      method: "DELETE",
      headers: headersWithUserRole(userId, role),
    });
  },
  getShelf(userId: string) {
    return apiFetch<{ items: ReadingBook[] }>("reading/shelf", {
      headers: headersWithUser(userId),
    });
  },
  addToShelf(userId: string, bookId: string) {
    return apiFetch<void>("reading/shelf", {
      method: "POST",
      headers: headersWithUser(userId),
      body: { bookId },
    });
  },
  removeFromShelf(userId: string, bookId: string) {
    return apiFetch<void>(`reading/shelf/${bookId}`, {
      method: "DELETE",
      headers: headersWithUser(userId),
    });
  },
  getProgress(userId: string, bookId: string) {
    return apiFetch<{ position: number; progress: number; updatedAt: string } | null>(
      `reading/progress/${bookId}`,
      {
        headers: headersWithUser(userId),
      }
    );
  },
  updateProgress(userId: string, payload: ReadingProgressPayload) {
    return apiFetch<{ position: number; progress: number; updatedAt: string }>(
      "reading/progress",
      {
        method: "POST",
        headers: headersWithUser(userId),
        body: payload,
      }
    );
  },
  getPreferences(userId: string) {
    return apiFetch<ReadingPreferences>("reading/preferences", {
      headers: headersWithUser(userId),
    });
  },
  updatePreferences(userId: string, payload: ReadingPreferences) {
    return apiFetch<ReadingPreferences>("reading/preferences", {
      method: "PUT",
      headers: headersWithUser(userId),
      body: payload,
    });
  },
};
