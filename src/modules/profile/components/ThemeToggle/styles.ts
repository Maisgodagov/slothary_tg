import styled from 'styled-components';

export const ToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--tg-border);
  background: var(--tg-surface);
  color: var(--tg-text);
  cursor: pointer;
  transition: background 0.25s ease, border-color 0.25s ease;
`;

export const ToggleTrack = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  width: 80px;
  height: 40px;
  border-radius: 999px;
  background: var(--tg-card);
  padding: 4px;
  gap: 4px;
  transition: background 0.25s ease;
`;

export const ToggleThumb = styled.div<{ $active: boolean; $activeColor: string }>`
  border-radius: 999px;
  background: ${({ $active, $activeColor }) => ($active ? $activeColor : 'transparent')};
  display: grid;
  place-items: center;
  transition: background 0.3s ease;
`;
