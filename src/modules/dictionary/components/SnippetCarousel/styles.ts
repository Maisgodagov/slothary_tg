import styled from 'styled-components';

export const CarouselWrapper = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-top: 4px;
  padding-bottom: 10px;
  padding-left: calc((100% - var(--card-width, 300px)) / 2);
  padding-right: calc((100% - var(--card-width, 300px)) / 2);
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
`;

export const CarouselItem = styled.div<{ $active: boolean }>`
  flex: 0 0 auto;
  scroll-snap-stop: always;
  opacity: ${({ $active }) => ($active ? 1 : 0.55)};
  transform: ${({ $active }) => ($active ? 'scale(1)' : 'scale(0.92)')};
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: center;
`;

export const CarouselCounter = styled.div`
  text-align: center;
  font-size: 13px;
  color: var(--tg-subtle);
`;
