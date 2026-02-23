import type { Dispatch, SetStateAction } from 'react';
import type { ReinforcementTask } from '../../api/types';

export type MissingExerciseModel = {
  rawTokens: string[];
  blankIndexes: number[];
  expectedWords: [string, string];
  options: string[];
};

export type ReinforcementCardProps = {
  reinforcement: ReinforcementTask;
  submitting: boolean;
  reinforcementChecked: boolean;
  canCheckReinforcement: boolean;
  missingExerciseModel: MissingExerciseModel | null;
  missingSelected: [string | null, string | null];
  setMissingSelected: Dispatch<SetStateAction<[string | null, string | null]>>;
  assembleAnswer: string[];
  setAssembleAnswer: Dispatch<SetStateAction<string[]>>;
  pairMatches: Record<string, string>;
  setPairMatches: Dispatch<SetStateAction<Record<string, string>>>;
  pairLeftSelected: string | null;
  setPairLeftSelected: Dispatch<SetStateAction<string | null>>;
  pairRightSelected: string | null;
  setPairRightSelected: Dispatch<SetStateAction<string | null>>;
  pairWrongWord: string | null;
  setPairWrongWord: Dispatch<SetStateAction<string | null>>;
  pairWrongTranslation: string | null;
  setPairWrongTranslation: Dispatch<SetStateAction<string | null>>;
  normalize: (value: string) => string;
  normalizeLoose: (value: string) => string;
  getTokenUsage: (tokens: string[]) => Map<string, number>;
  onPlayAudioUrl: (url: string | null) => Promise<void>;
  onSpeakWord: (word: string) => void;
  onPlayFeedbackSound: (isCorrect: boolean) => Promise<void>;
  onSubmitReinforcement: () => void;
};
