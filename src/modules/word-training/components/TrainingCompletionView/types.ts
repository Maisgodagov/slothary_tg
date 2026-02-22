import type { WordTrainingMasteryMap } from '../../api/types';

export type TrainingCompletionStage = 'praise' | 'map';

export type TrainingCompletionViewProps = {
  stage: TrainingCompletionStage;
  wordsCompleted: number;
  xpEarned: number;
  totalWordsToday: number;
  totalXpToday: number;
  masteryMap: WordTrainingMasteryMap | null;
  animatedFilledCellIds: Record<number, true>;
  submitting: boolean;
  onRestart: () => void;
};
