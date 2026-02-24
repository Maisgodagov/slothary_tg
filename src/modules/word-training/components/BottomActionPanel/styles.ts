import styled from 'styled-components';

export const PanelRoot = styled.div`
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 560px;
  bottom: calc(54px + var(--tg-safe-area-inset-bottom, 0px));
  z-index: 40;
  border-radius: 18px 18px 0 0;
  border: 1px solid var(--tg-border);
  border-bottom: none;
  background: var(--tg-card);
  box-shadow: none;
  padding: 12px 12px 10px;
  display: grid;
  gap: 10px;
`;

export const MessageBox = styled.div<{ $correct: boolean }>`
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid ${({ $correct }) => ($correct ? 'rgba(67, 201, 127, 0.65)' : 'rgba(255, 95, 109, 0.65)')};
  background: ${({ $correct }) => ($correct ? 'rgba(67, 201, 127, 0.12)' : 'rgba(255, 95, 109, 0.12)')};
  display: grid;
  gap: 4px;
`;

export const MessageTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
`;

export const MessageSubtitle = styled.div`
  color: var(--tg-subtle);
  font-weight: 600;
`;

export const ActionsRow = styled.div<{ $count: number }>`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(${({ $count }) => Math.max(1, $count)}, minmax(0, 1fr));
`;
