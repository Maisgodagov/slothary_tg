import styled from "styled-components";

export const ReadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 12px 20px;
  background: var(--tg-bg);
`;

export const TopBar = styled.div`
  display: grid;
  grid-template-columns: 32px 1fr 32px;
  align-items: center;
  gap: 8px;
`;

export const BackButton = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--tg-text);
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

export const IconButton = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--tg-text);
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  justify-self: end;
`;

export const TopTitle = styled.div`
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  color: var(--tg-text);
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--tg-text);
  font-size: 14px;
  font-weight: 700;
`;

export const SectionLink = styled.button`
  border: none;
  background: transparent;
  color: var(--tg-accent);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
`;

export const ShelfRow = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
`;

export const ShelfCard = styled.button`
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 92px;
  color: var(--tg-text);
  cursor: pointer;
`;

export const ShelfCover = styled.div<{ $url?: string | null }>`
  width: 92px;
  height: 132px;
  border-radius: 12px;
  background: ${({ $url }) =>
    $url
      ? `linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url(${$url})`
      : "linear-gradient(135deg, #1a1f2b, #2c364d)"};
  background-size: cover;
  background-position: center;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

export const ShelfProgress = styled.div`
  position: absolute;
  right: 6px;
  top: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
`;

export const ShelfTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  max-width: 92px;
`;

export const Grid = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

export const GridCard = styled.button`
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--tg-text);
  cursor: pointer;
  text-align: left;
`;

export const GridCover = styled.div<{ $url?: string | null }>`
  width: 100%;
  aspect-ratio: 3 / 4.2;
  border-radius: 14px;
  background: ${({ $url }) =>
    $url
      ? `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55)), url(${$url})`
      : "linear-gradient(135deg, #1a1f2b, #2c364d)"};
  background-size: cover;
  background-position: center;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

export const GridTitle = styled.div`
  font-size: 14px;
  font-weight: 800;
  line-height: 1.25;
`;

export const GridAuthor = styled.div`
  font-size: 12px;
  color: var(--tg-text-secondary);
`;

export const LevelTag = styled.div`
  background: rgba(46, 163, 255, 0.15);
  color: var(--tg-accent);
  font-size: 11px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 10px;
`;

export const EmptyState = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  color: var(--tg-text-secondary);
  font-size: 14px;
`;

