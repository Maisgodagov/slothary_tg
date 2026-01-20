export type SearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  historyItems: string[];
  historyOpen: boolean;
  onOpenHistory: () => void;
  onCloseHistory: () => void;
  onSelectHistory: (value: string) => void;
  loading: boolean;
};
