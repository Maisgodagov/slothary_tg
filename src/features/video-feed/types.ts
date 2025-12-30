export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type SpeechSpeed = 'slow' | 'normal' | 'fast';

export interface AnalysisResult {
  cefrLevel: CEFRLevel;
  speechSpeed: SpeechSpeed;
  grammarComplexity: 'simple' | 'intermediate' | 'complex';
  vocabularyComplexity: 'basic' | 'intermediate' | 'advanced';
  topics: string[];
}

export interface VideoFeedItem {
  id: string;
  videoName: string;
  videoUrl: string;
  durationSeconds: number | null;
  analysis: AnalysisResult;
  status: 'NOT_STARTED' | 'WATCHED' | 'COMPLETED';
  likesCount: number;
  isLiked: boolean;
  audioLevel?: number;
  createdAt: string;
  isAdultContent?: boolean;
  isModerated?: boolean;
  author?: string | null;
}

export interface VideoFeedResponse {
  items: VideoFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}
