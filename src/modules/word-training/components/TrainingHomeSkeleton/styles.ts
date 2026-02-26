import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
`;

export const SkeletonBlock = styled.div<{ $height: number; $width?: string }>`
  width: ${({ $width }) => $width ?? "100%"};
  height: ${({ $height }) => `${$height}px`};
  border-radius: 10px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--tg-border) 58%, transparent) 0%,
    color-mix(in srgb, var(--tg-border) 86%, transparent) 50%,
    color-mix(in srgb, var(--tg-border) 58%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.2s linear infinite;
`;

export const SkeletonTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const SkeletonTopLeft = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  gap: 8px;
`;

export const SkeletonCircle = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--tg-border) 58%, transparent) 0%,
    color-mix(in srgb, var(--tg-border) 86%, transparent) 50%,
    color-mix(in srgb, var(--tg-border) 58%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.2s linear infinite;
  flex-shrink: 0;
`;

export const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(23, minmax(0, 1fr));
  gap: 4px;
`;

export const SkeletonCell = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 4px;
  background: color-mix(in srgb, var(--tg-border) 72%, transparent);
`;
