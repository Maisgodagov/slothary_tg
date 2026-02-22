import type { PhraseSnippet } from '../../../../features/video-dictionary/api';

export type PracticeSnippetCardProps = {
  word: string;
  snippets: PhraseSnippet[];
  loading: boolean;
};

