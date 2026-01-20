import { SnippetCard } from '../SnippetCard';
import type { SearchSnippetsCarouselProps } from './types';
import { Counter, Slider, SliderItem } from './styles';

const snippetKey = (snippet: {
  id?: string;
  contentId: string;
  startSeconds: number;
  endSeconds: number;
  matchedText: string;
}) => {
  if (snippet.id) return snippet.id;
  return `${snippet.contentId}-${snippet.startSeconds}-${snippet.endSeconds}-${snippet.matchedText}`;
};

export function SearchSnippetsCarousel({
  items,
  highlight,
  activeIndex,
  onOpenFullVideo,
  total,
  sliderRef,
  onCardRef,
  onFirstCardRef,
}: SearchSnippetsCarouselProps) {
  return (
    <>
      <Slider ref={sliderRef}>
        {items.map((snippet, index) => {
          const isActive = index === activeIndex;
          const shouldRender = Math.abs(index - activeIndex) <= 1;

          return (
            <SliderItem
              key={snippetKey(snippet)}
              ref={(node) => {
                onCardRef(index, node);
                if (index === 0) onFirstCardRef(node);
              }}
              $active={isActive}
            >
              <SnippetCard
                snippet={snippet}
                isActive={isActive}
                shouldRender={shouldRender}
                highlight={highlight}
                onOpenFullVideo={onOpenFullVideo}
              />
            </SliderItem>
          );
        })}
      </Slider>
      <Counter>
        {(() => {
          const displayTotal = total > 0 ? total : items.length;
          const displayIndex = Math.min(activeIndex + 1, displayTotal);
          return `${displayIndex}/${displayTotal}`;
        })()}
      </Counter>
    </>
  );
}
