import { apiFetch } from '../../shared/api/client';

type SessionStatus = 'active' | 'completed' | 'interrupted';
type SourceType = 'manual' | 'viewed' | 'exercise';
type QueueReason = 'review' | 'mistake' | 'new' | 'retry';
type RecognitionGrade = 'again' | 'hard' | 'good' | 'easy';
type ExerciseType = 'missing' | 'audio_assemble' | 'match_pairs';

export interface WordTrainingOverview {
  dueCount: number;
  mistakeCount: number;
  newCount: number;
  masteredCount: number;
  trackedWords: number;
  suggestedTargetWords: number;
  todayProgress: {
    wordsDone: number;
    xpGained: number;
    sessionsDone: number;
  };
  activeSession: {
    id: string;
    energyLeft: number;
    wordsCompleted: number;
    targetWords: number;
  } | null;
}

export interface WordTrainingSession {
  id: string;
  status: SessionStatus;
  targetWords: number;
  energyStart: number;
  energyLeft: number;
  reviewPlanned: number;
  mistakePlanned: number;
  newPlanned: number;
  wordsCompleted: number;
  xpEarned: number;
  startedAt: string;
  completedAt: string | null;
}

export interface WordTrainingContext {
  contentId: number;
  videoName: string;
  videoUrl: string | null;
  startSeconds: number | null;
  endSeconds: number | null;
  text: string;
}

export interface RecognitionTask {
  mode: 'recognition';
  itemId: number;
  wordKey: string;
  word: string;
  pronunciationAudioUrl?: string | null;
  translation: string;
  sourceType: SourceType;
  reason: QueueReason;
  attemptCount: number;
  queuePosition: number;
  queueTotal: number;
  context: WordTrainingContext | null;
  recognitionOptions: string[];
  showReinforcementAfter: boolean;
}

export interface ReinforcementTask {
  mode: 'reinforcement';
  itemId: number;
  wordKey: string;
  word: string;
  pronunciationAudioUrl?: string | null;
  translation: string;
  sourceType: SourceType;
  reason: QueueReason;
  queuePosition: number;
  queueTotal: number;
  context: WordTrainingContext | null;
  reinforcement: {
    type: ExerciseType;
    sentence?: string;
    sentenceWithBlank?: string;
    sentenceTranslation?: string | null;
    phraseAudioUrl?: string | null;
    options?: string[];
    correctWord?: string;
    assembleTokens?: string[];
    targetTokens?: string[];
    targetWord: string;
    pairs?: Array<{
      word: string;
      translation: string;
      pronunciationAudioUrl?: string | null;
    }>;
    shuffledTranslations?: string[];
  };
}

export type WordTrainingTask = RecognitionTask | ReinforcementTask;

export interface WordTrainingState {
  session: WordTrainingSession;
  task: WordTrainingTask | null;
  summary?: {
    totalXpToday: number;
    totalWordsToday: number;
  };
  alternateExample?: WordTrainingContext | null;
}

const headersWithUser = (userId?: string | null) => (userId ? { 'x-user-id': userId } : undefined);

export const wordTrainingApi = {
  getOverview(userId?: string | null) {
    return apiFetch<WordTrainingOverview>('word-training/overview', {
      headers: headersWithUser(userId),
    });
  },
  startSession(body: { targetWords?: number }, userId?: string | null) {
    return apiFetch<WordTrainingState>('word-training/sessions', {
      method: 'POST',
      headers: headersWithUser(userId),
      body,
    });
  },
  getSession(sessionId: string, userId?: string | null) {
    return apiFetch<WordTrainingState>(`word-training/sessions/${sessionId}`, {
      headers: headersWithUser(userId),
    });
  },
  submitRecognition(
    sessionId: string,
    body: { itemId: number; grade: RecognitionGrade },
    userId?: string | null,
  ) {
    return apiFetch<WordTrainingState>(`word-training/sessions/${sessionId}/recognition`, {
      method: 'POST',
      headers: headersWithUser(userId),
      body,
    });
  },
  submitReinforcement(
    sessionId: string,
    body: { itemId: number; exerciseType: ExerciseType; isCorrect: boolean },
    userId?: string | null,
  ) {
    return apiFetch<WordTrainingState>(`word-training/sessions/${sessionId}/reinforcement`, {
      method: 'POST',
      headers: headersWithUser(userId),
      body,
    });
  },
  finishSession(sessionId: string, body: { force?: boolean }, userId?: string | null) {
    return apiFetch<WordTrainingState>(`word-training/sessions/${sessionId}/finish`, {
      method: 'POST',
      headers: headersWithUser(userId),
      body,
    });
  },
  getExamples(word: string, userId?: string | null, limit = 3) {
    const query = new URLSearchParams({ word, limit: String(limit) });
    return apiFetch<{ items: WordTrainingContext[] }>(`word-training/examples?${query.toString()}`, {
      headers: headersWithUser(userId),
    });
  },
};
