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
  border-radius: 28px;
  border: none;
  background: var(--tg-card-strong);
  padding: 12px;
  display: grid;
  gap: 10px;
  align-content: start;
  box-shadow: 0 1px 4px var(--tg-shadow-soft);
`;

export const NextTrainingTitle = styled.strong`
  color: var(--tg-text);
  font-size: 14px;
  line-height: 1.1;
  font-weight: 600;
  min-width: 0;
`;

export const NextTrainingTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const NextTrainingHeaderWrap = styled.div`
  flex: 0 1 75%;
  min-width: 0;
  display: grid;
  gap: 6px;
`;

export const NextTrainingTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

export const NextTrainingCounter = styled.div`
  color: var(--tg-success);
  font-size: 16px;
  font-weight: 900;
  line-height: 1;
  flex-shrink: 0;
`;

export const NextTrainingProgressTrack = styled.div`
  height: 5px;
  border-radius: 999px;
  background: var(--tg-border);
  overflow: hidden;
`;

export const NextTrainingProgressFill = styled.div<{ $width: number }>`
  width: ${({ $width }) => `${$width}%`};
  height: 100%;
  border-radius: 999px;
  background: var(--tg-button-primary-bg);
  transition: width 240ms ease;
`;

export const NextTrainingLevelBadge = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--tg-border);
  flex-shrink: 0;
`;

export const NextTrainingLevelText = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--tg-card);
  border: 1px solid var(--tg-border);
  font-size: 12px;
  font-weight: 900;
  color: var(--tg-text);
`;

export const NextTrainingButton = styled.button`
  width: 100%;
  border-style: solid;
  border-width: 3px;
  border-color: var(--tg-button-primary-border);
  border-radius: 24px;
  min-height: 52px;
  font-size: 20px;
  font-weight: 700;
  color: var(--tg-button-primary-text);
  background: var(--tg-button-primary-bg);
  background-image: none;
  box-shadow: 0 4px 0 var(--tg-button-primary-shadow), 0 8px 14px var(--tg-shadow-strong);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 var(--tg-button-primary-shadow), 0 4px 8px var(--tg-shadow-soft);
  }
`;

export const NextTrainingButtonLabel = styled.span`
  display: grid;
  gap: 2px;
  line-height: 1.05;
  text-align: center;
`;

export const NextTrainingButtonSub = styled.span`
  font-size: 13px;
  font-weight: 600;
  opacity: 0.9;
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
