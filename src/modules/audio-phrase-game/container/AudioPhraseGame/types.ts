import type { AudioPhraseGameDifficulty } from '../../types';

export type AudioPhraseGameProps = {
  userId?: string | null;
  onXp: (xpPoints: number) => void;
  maxRounds?: number;
  showHeader?: boolean;
  difficulty?: AudioPhraseGameDifficulty;
  levelId: string;
  onLevelComplete?: (reward: number) => void;
};
