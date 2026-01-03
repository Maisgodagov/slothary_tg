import { apiFetch } from '../../shared/api/client';

export type ExerciseDirection = "en-ru" | "ru-en";

export interface ExerciseProgress {
  status: "new" | "learning" | "known" | "ignored";
  touchesTotal: number;
  touchesCorrect: number;
  streak: number;
  addedToVocab: boolean;
}

export interface ExerciseItem {
  wordId: number;
  word: string;
  partOfSpeech: string | null;
  direction: ExerciseDirection;
  prompt: string;
  correctAnswer: string;
  options: string[];
  translations: string[];
  progress: ExerciseProgress;
}

export interface GetExercisesRequest {
  wordIds: number[];
  wordLimit?: number;
  exerciseLimit?: number;
  videoId?: number;
}

export const exercisesApi = {
  async getExercises(body: GetExercisesRequest, userId?: string | null) {
    return apiFetch<{ exercises: ExerciseItem[] }>('exercises/for-content', {
      method: 'POST',
      headers: userId ? { 'x-user-id': userId } : undefined,
      body,
    });
  },
};
