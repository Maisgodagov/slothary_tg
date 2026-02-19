import { useCallback, useEffect, useRef, useState } from 'react';

import { SnippetCard } from '../SnippetCard';
import type { SnippetCarouselProps } from './types';
import { CarouselCounter, CarouselItem, CarouselWrapper } from './styles';

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

export function SnippetCarousel({
  items,
  highlight,
  onOpenFullVideo,
  showFullVideoButton = true,
  total,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: SnippetCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardWidthRef = useRef(0);
  const scrollRaf = useRef<number | null>(null);

  const updateCardWidth = useCallback(() => {
    const first = cardRefs.current[0];
    if (!first) return;
    const width = first.getBoundingClientRect().width;
    cardWidthRef.current = width;
    sliderRef.current?.style.setProperty('--card-width', `${width}px`);
  }, []);

  const getCenteredIndex = useCallback(() => {
    if (!sliderRef.current || items.length === 0) return 0;
    const containerRect = sliderRef.current.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((node, index) => {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(center - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }, [items.length]);

  useEffect(() => {
    updateCardWidth();
    const first = cardRefs.current[0];
    if (!first) return;
    const observer = new ResizeObserver(() => updateCardWidth());
    observer.observe(first);
    return () => observer.disconnect();
  }, [items.length, updateCardWidth]);

  useEffect(() => {
    const node = sliderRef.current;
    if (!node) return;
    const handleScroll = () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = requestAnimationFrame(() => {
        setActiveIndex(getCenteredIndex());
      });
    };
    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => node.removeEventListener('scroll', handleScroll);
  }, [getCenteredIndex]);

  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) {
      setActiveIndex(items.length - 1);
    }
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;
    if (items.length === 0) return;
    if (activeIndex >= items.length - 2) {
      onLoadMore();
    }
  }, [activeIndex, hasMore, isLoadingMore, items.length, onLoadMore]);

  return (
    <>
      <CarouselWrapper ref={sliderRef}>
        {items.map((snippet, index) => {
          const isActive = index === activeIndex;
          const shouldRender = Math.abs(index - activeIndex) <= 1;
          return (
            <CarouselItem
              key={snippetKey(snippet)}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              $active={isActive}
            >
              <SnippetCard
                snippet={snippet}
                isActive={isActive}
                shouldRender={shouldRender}
                highlight={highlight}
                onOpenFullVideo={onOpenFullVideo}
                showFullVideoButton={showFullVideoButton}
              />
            </CarouselItem>
          );
        })}
      </CarouselWrapper>
      <CarouselCounter>
        {Math.min(activeIndex + 1, total ?? items.length)}/{total ?? items.length}
      </CarouselCounter>
    </>
  );
}
