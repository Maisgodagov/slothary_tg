import styled from 'styled-components';

export const Wrap = styled.div`
  display: grid;
  gap: 6px;
`;

export const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CloseButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--tg-subtle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const ProgressTrack = styled.div`
  height: 7px;
  flex: 1;
  background: var(--tg-border);
  border-radius: 999px;
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $percent: number }>`
  width: ${({ $percent }) => `${$percent}%`};
  height: 100%;
  background: var(--tg-success);
  transition: width 220ms ease;
`;

export const MetaLine = styled.div<{ $weight?: number }>`
  color: var(--tg-subtle);
  font-size: 12px;
  font-weight: ${({ $weight }) => $weight ?? 700};
  line-height: 1;
`;

export const DebugButton = styled.button`
  width: fit-content;
  border-radius: 10px;
  border: 1px dashed var(--tg-border);
  background: transparent;
  color: var(--tg-subtle);
  font-size: 12px;
  font-weight: 700;
  padding: 5px 9px;
`;

export const RetryPhaseCard = styled.div`
  border-radius: 16px;
  padding: 10px;
  font-weight: 700;
  background: rgba(255, 196, 64, 0.08);
  border: 1px solid rgba(255, 196, 64, 0.45);
`;

