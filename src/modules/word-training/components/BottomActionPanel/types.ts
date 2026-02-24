import type { CSSProperties } from 'react';

export type BottomActionPanelAction = {
  key: string;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: CSSProperties;
};

export type BottomActionPanelProps = {
  visible: boolean;
  isCorrect: boolean;
  title: string;
  subtitle?: string | null;
  onNext: () => void;
  buttonLabel?: string;
  nextDisabled?: boolean;
  hideMessageBox?: boolean;
  submitting?: boolean;
  actions?: BottomActionPanelAction[];
};
