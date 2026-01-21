import type { DictionaryStats } from '../../api/types';

export type ProgressSummaryProps = {
  stats: DictionaryStats | null;
  loading: boolean;
  onDetails: () => void;
};
