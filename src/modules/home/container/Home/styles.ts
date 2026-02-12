import styled from "styled-components";

const shimmer = `
  @keyframes homeSkeletonShimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
`;

export const HomeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 12px;
  padding-left: 12px;
`;

export const HomeSkeletonLayout = styled.div`
  display: grid;
  gap: 14px;
  padding-right: 12px;
  padding-left: 12px;
  ${shimmer}
`;

export const HomeSkeletonHeader = styled.div`
  border-radius: 24px;
  background: var(--tg-card-strong);
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const HomeSkeletonLine = styled.div<{ $w?: string; $h?: string }>`
  width: ${({ $w }) => $w ?? "100%"};
  height: ${({ $h }) => $h ?? "14px"};
  border-radius: 10px;
  background: linear-gradient(
    90deg,
    var(--tg-card) 0%,
    var(--tg-border) 50%,
    var(--tg-card) 100%
  );
  background-size: 200% 100%;
  animation: homeSkeletonShimmer 1.2s linear infinite;
`;

export const HomeSkeletonHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const HomeSkeletonAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    var(--tg-card) 0%,
    var(--tg-border) 50%,
    var(--tg-card) 100%
  );
  background-size: 200% 100%;
  animation: homeSkeletonShimmer 1.2s linear infinite;
  flex-shrink: 0;
`;

export const HomeSkeletonHeaderText = styled.div`
  display: grid;
  gap: 6px;
`;

export const HomeSkeletonStreak = styled.div`
  width: 96px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid var(--tg-border);
  background: linear-gradient(
    90deg,
    var(--tg-card) 0%,
    var(--tg-border) 50%,
    var(--tg-card) 100%
  );
  background-size: 200% 100%;
  animation: homeSkeletonShimmer 1.2s linear infinite;
  flex-shrink: 0;
`;

export const HomeSkeletonCard = styled.div`
  border-radius: 28px;
  background: var(--tg-card-strong);
  padding: 12px;
  display: grid;
  gap: 10px;
`;
