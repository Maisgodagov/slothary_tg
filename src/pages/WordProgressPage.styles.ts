import styled from "styled-components";

export const PageWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 12px 60px;
`;

export const SummaryCard = styled.div`
  border-radius: 20px;
  border: none;
  background: var(--tg-surface);
  padding: 16px;
  display: grid;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);

  [data-theme="light"] & {
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  }
`;

export const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const SummaryTitle = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--tg-text);
`;

export const SummaryTabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
`;

export const SummaryTab = styled.button<{
  $active?: boolean;
  $tone: "learning" | "known" | "viewed";
}>`
  border: none;
  cursor: pointer;
  border-radius: 16px;
  padding: 10px 12px;
  display: grid;
  gap: 6px;
  text-align: center;
  justify-items: center;
  color: var(--tg-text);
  background: var(--tg-bg);
  border: 1px solid ${({ $active }) =>
    $active ? "var(--tg-accent)" : "var(--tg-border)"};
  box-shadow: ${({ $active }) =>
    $active ? "0 1px 4px rgba(15, 23, 42, 0.06)" : "none"};

  span {
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  strong {
    font-size: 18px;
    font-weight: 800;
  }

  [data-theme="light"] & {
    color: var(--tg-text);
    background: var(--tg-bg);
    border: 1px solid ${({ $active }) =>
      $active ? "var(--tg-accent)" : "var(--tg-border)"};
    box-shadow: ${({ $active }) =>
      $active ? "0 1px 4px rgba(15, 23, 42, 0.06)" : "none"};

    span {
      opacity: 0.6;
    }
  }
`;

export const ListSection = styled.div`
  display: grid;
  gap: 12px;
`;

export const ListTitle = styled.h2`
  margin: 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--tg-subtle);
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
