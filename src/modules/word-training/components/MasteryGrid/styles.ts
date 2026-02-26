import styled from 'styled-components';

export const GridCard = styled.div<{ $fillHeight: boolean }>`
  border-radius: 20px;
  display: grid;
  flex: ${({ $fillHeight }) => ($fillHeight ? '1 1 auto' : '0 0 auto')};
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--tg-border);
  background: var(--tg-training-container-bg);
  height: ${({ $fillHeight }) => ($fillHeight ? '100%' : 'auto')};
  min-height: ${({ $fillHeight }) => ($fillHeight ? '0' : 'auto')};
  overflow-y: ${({ $fillHeight }) => ($fillHeight ? 'auto' : 'visible')};
  margin: ${({ $fillHeight }) => ($fillHeight ? '0' : '0 0 14px 0')};
`;

export const LevelWrap = styled.div`
  display: grid;
  gap: 8px;
`;

export const LevelHeaderRow = styled.div`
  position: relative;
  min-height: 24px;
`;

export const LevelHeaderTitle = styled.div`
  font-size: 17px;
  font-weight: 800;
  text-align: center;
`;

export const LevelHeaderCounter = styled.div`
  font-size: 12px;
  color: var(--tg-subtle);
  font-weight: 700;
  position: absolute;
  right: 0;
  top: 3px;
`;

export const SectionWrap = styled.div<{ $isFirst: boolean }>`
  display: grid;
  gap: 6px;
  padding-top: ${({ $isFirst }) => ($isFirst ? '0' : '8px')};
  margin-top: ${({ $isFirst }) => ($isFirst ? '0' : '2px')};
  border-top: ${({ $isFirst }) =>
    $isFirst
      ? 'none'
      : '1px dashed color-mix(in srgb, var(--tg-text) 14%, transparent)'};
`;

export const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: var(--tg-subtle);
  line-height: 1.2;
`;

export const CellsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(23, minmax(0, 1fr));
  gap: 4px;
`;

export const Cell = styled.div<{ $bg: string }>`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--tg-text) 8%, transparent);
  background: ${({ $bg }) => $bg};
  transition: background-color 220ms ease;
`;

