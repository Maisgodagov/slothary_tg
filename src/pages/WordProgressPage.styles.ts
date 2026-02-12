import styled from "styled-components";

const shimmer = `
  @keyframes wordProgressSkeletonShimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
`;

export const PageWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 12px 60px;
`;

export const SummaryTitle = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--tg-text);
`;

export const SummaryTabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const SkeletonChip = styled.div<{ $w?: string }>`
  height: 32px;
  min-width: ${({ $w }) => $w ?? "74px"};
  border-radius: 999px;
  border: 1px solid var(--tg-border);
  background: linear-gradient(
    90deg,
    var(--tg-card) 0%,
    var(--tg-border) 50%,
    var(--tg-card) 100%
  );
  background-size: 200% 100%;
  animation: wordProgressSkeletonShimmer 1.2s linear infinite;
`;

export const SummaryTab = styled.button<{
  $active?: boolean;
  $tone: "learning" | "known" | "viewed";
}>`
  border: 1px solid var(--tg-border);
  cursor: pointer;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  border-color: var(--tg-border);
  background: ${({ $active }) =>
    $active ? "var(--tg-card)" : "var(--tg-card-strong)"};
  color: ${({ $active }) => ($active ? "var(--tg-text)" : "var(--tg-subtle)")};

  body[data-theme="dark"] & {
    ${({ $active }) =>
      $active
        ? `
      border-color: var(--tg-accent-strong);
      background: var(--tg-card);
    `
        : ""}
  }
`;

export const ListSection = styled.div`
  display: grid;
  gap: 12px;
`;

export const WordsListSkeleton = styled.div`
  display: grid;
  gap: 12px;
  ${shimmer}
`;

export const WordCardSkeleton = styled.div`
  border-radius: 20px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card-strong);
  padding: 14px 14px 12px;
  display: grid;
  gap: 10px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
`;

export const SkeletonLine = styled.div<{ $w?: string; $h?: string }>`
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
  animation: wordProgressSkeletonShimmer 1.2s linear infinite;
`;

export const SkeletonStatsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const WordsList = styled.div`
  display: grid;
  gap: 12px;
`;

export const WordCardWrap = styled.div`
  position: relative;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  border-radius: 16px;

  [data-theme="light"] & {
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  }
`;

export const StatusBadge = styled.span<{
  $tone: "learning" | "known" | "viewed";
}>`
  position: absolute;
  top: 14px;
  right: 16px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tg-subtle);

  [data-theme="light"] & {
    color: var(--tg-subtle);
  }
`;

export const WordMeta = styled.div`
  display: grid;
  gap: 8px;
  font-size: 12px;
  color: var(--tg-subtle);
`;

export const WordStatsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
`;

export const StatChip = styled.span<{
  $tone: "success" | "danger" | "neutral";
}>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: ${({ $tone }) =>
    ({
      success: "var(--tg-success)",
      danger: "var(--tg-danger)",
      neutral: "var(--tg-subtle)",
    })[$tone]};

  &::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: currentColor;
    display: inline-block;
  }
`;

export const ProgressTrack = styled.div`
  height: 3px;
  width: 36px;
  border-radius: 999px;
  background: var(--tg-border);
  overflow: hidden;

  [data-theme="light"] & {
    background: var(--tg-border);
  }
`;

export const ProgressFill = styled.div<{
  $percent: number;
  $tone: "learning" | "known" | "viewed";
}>`
  height: 100%;
  width: ${({ $percent }) => `${$percent}%`};
  background: ${({ $tone }) =>
    ({
      learning: "#5ab0ff",
      known: "#f3c44a",
      viewed: "#5cd48a",
    })[$tone]};
  transition: width 0.2s ease;
`;

export const EmptyState = styled.div`
  font-size: 13px;
  color: var(--tg-subtle);
`;

export const LoadingState = styled.div`
  font-size: 13px;
  color: var(--tg-subtle);
`;
