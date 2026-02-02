export interface ReadingBook {
  id: string;
  title: string;
  author?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  fileUrl: string;
  language: string;
  cefrLevel?: string | null;
  wordCount?: number | null;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
  inShelf?: boolean;
  progress?: {
    position: number;
    progress: number;
    updatedAt: string;
  } | null;
}

export interface ReadingPreferences {
  readerFontSize: number;
}

export interface ReadingProgressPayload {
  bookId: string;
  position?: number;
  progress?: number;
}
