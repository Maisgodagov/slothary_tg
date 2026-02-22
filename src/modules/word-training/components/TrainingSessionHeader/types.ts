export type StageProgressItem = {
  key: string;
  label: string;
  total: number;
  completed: number;
  percent: number;
  isCurrent: boolean;
  isDone: boolean;
};

export type TrainingSessionHeaderProps = {
  submitting: boolean;
  lessonProgressPercent: number;
  lessonProgressLabel: string;
  currentStageLabel: string | null;
  stageProgress: StageProgressItem[];
  isAdmin: boolean;
  retryPhaseTitle?: string | null;
  showRetryPhase: boolean;
  onFinishEarly: () => void;
  onSkipDebug: () => void;
};

