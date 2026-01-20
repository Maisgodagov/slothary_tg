import type { RefObject } from 'react';
import type { PhraseSnippet } from '../../api/types';

export type SearchSnippetsCarouselProps = {
  items: PhraseSnippet[];
  highlight: string;
  activeIndex: number;
  onOpenFullVideo: (snippet: PhraseSnippet) => void;
  total: number;
  sliderRef: RefObject<HTMLDivElement | null>;
  onCardRef: (index: number, node: HTMLDivElement | null) => void;
  onFirstCardRef: (node: HTMLDivElement | null) => void;
};
