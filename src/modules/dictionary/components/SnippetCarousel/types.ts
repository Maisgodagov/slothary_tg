import type { PhraseSnippet } from '../../api/types';

export type SnippetCarouselProps = {
  items: PhraseSnippet[];
  highlight: string;
  onOpenFullVideo: (snippet: PhraseSnippet) => void;
  total?: number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
};
