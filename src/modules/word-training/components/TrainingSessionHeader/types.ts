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
  onFinishEarly: () => void;
};

