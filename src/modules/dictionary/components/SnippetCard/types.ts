import type { PhraseSnippet } from '../../api/types';

export type SnippetCardProps = {
  snippet: PhraseSnippet;
  isActive: boolean;
  shouldRender: boolean;
  highlight: string;
  onOpenFullVideo: (snippet: PhraseSnippet) => void;
  compact?: boolean;
  loop?: boolean;
  showFullVideoButton?: boolean;
  autoPlayActive?: boolean;
  initialPlayLabel?: string | null;
  onFirstManualPlay?: () => void;
};
