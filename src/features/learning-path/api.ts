import { apiFetch } from '../../shared/api/client';

export type LearningPathLessonStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type LearningPathModuleStatus = 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';

export interface LearningPathLessonSummary {
  id: string;
  orderIndex: number;
  phraseTextEn: string;
  phraseTextRu?: string | null;
  status: LearningPathLessonStatus;
  lastStepIndex?: number | null;
}

export interface LearningPathModuleSummary {
  id: string;
  orderIndex: number;
  title: string;
  levelTag?: string | null;
  isActive: boolean;
  status: LearningPathModuleStatus;
  completedLessonsCount: number;
  totalLessons: number;
  lessons: LearningPathLessonSummary[];
}

export interface LearningPathSnippet {
  id: string;
  phrase: string;
  translation?: string | null;
  contentId: number;
  startSeconds: number;
  endSeconds: number;
  videoUrl?: string | null;
  videoName?: string | null;
}

export interface LearningPathLessonDetail {
  id: string;
  module: { id: string; title: string; orderIndex: number };
  orderIndex: number;
  phraseTextEn: string;
  phraseTextRu?: string | null;
  difficultyTag?: string | null;
  xpReward: number;
  targetWords: string[];
  mainSnippet: LearningPathSnippet;
  altSnippets: LearningPathSnippet[];
  progress: {
    status: LearningPathLessonStatus;
    lastStepIndex: number | null;
    attemptsCount: number;
    completedAt?: string | null;
  } | null;
}

export interface LearningPathAdminModule {
  id: string;
  orderIndex: number;
  title: string;
  levelTag?: string | null;
  releaseStatus?: string | null;
  isActive: boolean;
  lessonCount: number;
}

export interface LearningPathAdminLesson {
  id: string;
  moduleId: string;
  moduleTitle: string;
  moduleOrderIndex: number;
  orderIndex: number;
  phraseTextEn: string;
  phraseTextRu?: string | null;
  difficultyTag?: string | null;
  xpReward: number;
  mainSnippet: LearningPathSnippet;
  altSnippets: LearningPathSnippet[];
  targetWords: string[];
}

const headersWithUser = (userId?: string | null) => (userId ? { 'x-user-id': userId } : undefined);

export const learningPathApi = {
  getPath(userId?: string | null) {
    return apiFetch<{ modules: LearningPathModuleSummary[] }>('learning-path/path', {
      headers: headersWithUser(userId),
    });
  },
  getLesson(lessonId: string, userId?: string | null) {
    return apiFetch<{ lesson: LearningPathLessonDetail }>(`learning-path/lessons/${lessonId}`, {
      headers: headersWithUser(userId),
    });
  },
  startLesson(lessonId: string, userId?: string | null, lastStepIndex?: number) {
    return apiFetch<{ progress: unknown }>(`learning-path/lessons/${lessonId}/start`, {
      method: 'POST',
      headers: headersWithUser(userId),
      body: { lastStepIndex },
    });
  },
  stepLesson(lessonId: string, userId?: string | null, lastStepIndex?: number) {
    return apiFetch<{ progress: unknown }>(`learning-path/lessons/${lessonId}/step`, {
      method: 'POST',
      headers: headersWithUser(userId),
      body: { lastStepIndex },
    });
  },
  completeLesson(lessonId: string, userId?: string | null, lastStepIndex?: number) {
    return apiFetch<{ awardedXp: number; moduleStatus: string | null }>(
      `learning-path/lessons/${lessonId}/complete`,
      {
        method: 'POST',
        headers: headersWithUser(userId),
        body: { lastStepIndex },
      },
    );
  },
  admin: {
    listModules() {
      return apiFetch<{ modules: LearningPathAdminModule[] }>('admin/learning-path/modules', {
        headers: { 'x-user-role': 'admin' },
      });
    },
    createModule(payload: {
      orderIndex: number;
      title: string;
      levelTag?: string | null;
      releaseStatus?: string | null;
      isActive?: boolean;
    }) {
      return apiFetch<{ module: LearningPathAdminModule }>('admin/learning-path/modules', {
        method: 'POST',
        headers: { 'x-user-role': 'admin' },
        body: payload,
      });
    },
    updateModule(id: string, payload: Partial<{ orderIndex: number; title: string; levelTag?: string | null; releaseStatus?: string | null; isActive?: boolean }>) {
      return apiFetch<{ module: LearningPathAdminModule }>(`admin/learning-path/modules/${id}`, {
        method: 'PATCH',
        headers: { 'x-user-role': 'admin' },
        body: payload,
      });
    },
    deleteModule(id: string) {
      return apiFetch<void>(`admin/learning-path/modules/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'admin' },
      });
    },
    listLessons(moduleId?: string) {
      const params = new URLSearchParams();
      if (moduleId) params.set('moduleId', moduleId);
      const qs = params.toString();
      return apiFetch<{ lessons: LearningPathAdminLesson[] }>(`admin/learning-path/lessons${qs ? `?${qs}` : ''}`, {
        headers: { 'x-user-role': 'admin' },
      });
    },
    createLesson(payload: {
      moduleId: string;
      orderIndex: number;
      phraseTextEn: string;
      phraseTextRu?: string | null;
      difficultyTag?: string | null;
      xpReward?: number;
      mainSnippetId: string;
      altSnippetIds?: string[];
      targetWords?: string[];
    }) {
      return apiFetch<{ lesson: LearningPathAdminLesson }>('admin/learning-path/lessons', {
        method: 'POST',
        headers: { 'x-user-role': 'admin' },
        body: payload,
      });
    },
    updateLesson(id: string, payload: Partial<{ moduleId: string; orderIndex: number; phraseTextEn: string; phraseTextRu?: string | null; difficultyTag?: string | null; xpReward?: number; mainSnippetId: string; altSnippetIds?: string[]; targetWords?: string[] }>) {
      return apiFetch<{ lesson: LearningPathAdminLesson }>(`admin/learning-path/lessons/${id}`, {
        method: 'PATCH',
        headers: { 'x-user-role': 'admin' },
        body: payload,
      });
    },
    deleteLesson(id: string) {
      return apiFetch<void>(`admin/learning-path/lessons/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'admin' },
      });
    },
    searchSnippets(query: string) {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      const qs = params.toString();
      return apiFetch<{ snippets: LearningPathSnippet[] }>(`admin/learning-path/snippets${qs ? `?${qs}` : ''}`, {
        headers: { 'x-user-role': 'admin' },
      });
    },
    importSnippet(payload: {
      contentId: number;
      startSeconds: number;
      endSeconds: number;
      phrase: string;
      translation?: string | null;
    }) {
      return apiFetch<{ snippet: LearningPathSnippet }>('admin/learning-path/snippets/import', {
        method: 'POST',
        headers: { 'x-user-role': 'admin' },
        body: payload,
      });
    },
  },
};
