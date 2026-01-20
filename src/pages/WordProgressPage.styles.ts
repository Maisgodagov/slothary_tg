import styled from "styled-components";

export const PageWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 12px 60px;
`;

export const SummaryCard = styled.div`
  border-radius: 20px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  padding: 16px;
  display: grid;
  gap: 14px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);

  [data-theme="light"] & {
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
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
  text-align: left;
  color: #fff;
  background: ${({ $tone, $active }) => {
    const base = {
      learning: "linear-gradient(135deg, #1f3b73, #1b2a52)",
      known: "linear-gradient(135deg, #5b4a1a, #3c2f12)",
      viewed: "linear-gradient(135deg, #1f4a3b, #163326)",
    }[$tone];
    return $active ? base : "rgba(255, 255, 255, 0.06)";
  }};
  box-shadow: ${({ $active }) =>
    $active ? "0 10px 18px rgba(0, 0, 0, 0.22)" : "none"};

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
    background: ${({ $tone, $active }) => {
      const base = {
        learning: "linear-gradient(135deg, #e6f0ff, #cfe3ff)",
        known: "linear-gradient(135deg, #fff2c9, #ffe2a3)",
        viewed: "linear-gradient(135deg, #e3f6ee, #c7ebdd)",
      }[$tone];
      return $active ? base : "#ffffff";
    }};
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: ${({ $active }) =>
      $active ? "0 8px 18px rgba(15, 23, 42, 0.12)" : "none"};

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
  color: rgba(255, 255, 255, 0.5);

  [data-theme="light"] & {
    color: rgba(15, 23, 42, 0.45);
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
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;

  [data-theme="light"] & {
    background: rgba(15, 23, 42, 0.12);
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
