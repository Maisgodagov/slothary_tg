import type { WordTrainingOverview, WordTrainingMasteryMap } from '../../api/types';

export type TrainingHomeProps = {
  overview: WordTrainingOverview;
  currentDisplayLevel: string;
  levelRingPercent: number;
  submitting: boolean;
  masteryLoading: boolean;
  suggestedWordsCount: number;
  masteryMap: WordTrainingMasteryMap | null;
  actionTitle?: string;
  actionSubtitle?: string;
  onStartOrResume: () => void;
  focusLevel?: string | null;
  focusBlock?: string | null;
};

