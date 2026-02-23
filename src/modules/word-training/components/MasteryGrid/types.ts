import type { WordTrainingMasteryMap } from '../../api/types';

export type MasteryGridProps = {
  masteryMap: WordTrainingMasteryMap | null;
  animated?: boolean;
  fillHeight?: boolean;
  animatedFilledCellIds?: Record<number, true>;
  focusLevel?: string | null;
  focusBlock?: string | null;
  autoScrollToFocus?: boolean;
};

