export type DeleteModalProps = {
  open: boolean;
  word: string;
  translation: string;
  onCancel: () => void;
  onConfirm: () => void;
};
