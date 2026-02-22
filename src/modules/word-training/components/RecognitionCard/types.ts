import type { CSSProperties } from 'react';

import type { RecognitionTask } from '../../api/types';

export type RecognitionCardProps = {
  recognition: RecognitionTask;
  submitting: boolean;
  recognitionChecked: boolean;
  recognitionWrongOption: string | null;
  optionButtonBaseStyle: CSSProperties;
  onPlayPronunciation: (recognition: RecognitionTask) => void;
  onPickOption: (option: string, isCorrect: boolean) => void;
  normalize: (value: string) => string;
};
