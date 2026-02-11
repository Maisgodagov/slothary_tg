import styled from 'styled-components';

export const Slider = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: calc((100% - var(--card-width, 320px)) / 2);
  padding-right: calc((100% - var(--card-width, 320px)) / 2);
  scroll-snap-type: x mandatory;
  scroll-behavior: auto;
  -webkit-overflow-scrolling: touch;
`;

export const SliderItem = styled.div<{ $active: boolean }>`
  flex: 0 0 auto;
  scroll-snap-stop: always;
  opacity: ${({ $active }) => ($active ? 1 : 0.42)};
  transform: ${({ $active }) => ($active ? 'scale(1)' : 'scale(0.96)')};
  transition: opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: center;
  will-change: transform, opacity;
`;

export const Counter = styled.div`
  text-align: center;
  font-size: 13px;
  color: var(--tg-subtle);
  margin-top: 2px;
`;
