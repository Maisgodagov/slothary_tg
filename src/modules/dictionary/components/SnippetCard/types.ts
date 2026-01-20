import type { PhraseSnippet } from '../../api/types';

export type SnippetCardProps = {
  snippet: PhraseSnippet;
  isActive: boolean;
  shouldRender: boolean;
  highlight: string;
  onOpenFullVideo: (snippet: PhraseSnippet) => void;
};
