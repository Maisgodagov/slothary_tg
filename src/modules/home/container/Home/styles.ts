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

export const NextTrainingCard = styled.section`
  border-radius: 20px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card-strong);
  padding: 14px;
  display: grid;
  gap: 10px;
`;

export const NextTrainingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

export const NextTrainingTitle = styled.strong`
  font-size: 18px;
  line-height: 1.2;
  font-weight: 800;
`;

export const NextTrainingMeta = styled.span`
  font-size: 12px;
  line-height: 1;
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, #6adf95 52%, var(--tg-border) 48%);
  color: #8ef3b8;
  background: color-mix(in srgb, #6adf95 14%, transparent 86%);
  white-space: nowrap;
`;

export const NextTrainingText = styled.div`
  font-size: 14px;
  line-height: 1.4;
  color: var(--tg-subtitle-text-color);
`;

export const NextTrainingStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`;

export const NextTrainingStat = styled.div`
  border-radius: 12px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  padding: 8px 6px;
  text-align: center;
  display: grid;
  gap: 4px;
`;

export const NextTrainingStatValue = styled.span`
  font-size: 16px;
  line-height: 1;
  font-weight: 800;
`;

export const NextTrainingStatLabel = styled.span`
  font-size: 11px;
  line-height: 1.1;
  color: var(--tg-subtitle-text-color);
`;

export const NextTrainingButton = styled.button`
  width: 100%;
  border: 0;
  border-radius: 14px;
  height: 44px;
  font-size: 16px;
  font-weight: 800;
  color: #0a1830;
  background: #39a3ec;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.12s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):active {
    transform: translateY(1px);
    filter: brightness(0.96);
  }
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
