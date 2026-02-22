export type BottomActionPanelProps = {
  visible: boolean;
  isCorrect: boolean;
  title: string;
  subtitle?: string | null;
  onNext: () => void;
  buttonLabel?: string;
  hideMessageBox?: boolean;
  submitting?: boolean;
};
