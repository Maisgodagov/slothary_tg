import styled from 'styled-components';

export const SearchRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const SearchFieldWrapper = styled.div`
  position: relative;
  flex: 1;
`;

export const SearchInput = styled.input<{ $historyOpen: boolean }>`
  width: 100%;
  border-radius: 12px;
  border-bottom-left-radius: ${({ $historyOpen }) => ($historyOpen ? '0' : '12px')};
  border-bottom-right-radius: ${({ $historyOpen }) => ($historyOpen ? '0' : '12px')};
  border: 1px solid var(--tg-border);
  border-bottom: ${({ $historyOpen }) => ($historyOpen ? 'none' : '1px solid var(--tg-border)')};
  height: 44px;
  padding: 0 36px 0 12px;
  background: var(--tg-card);
  color: var(--tg-text);
  font-size: 14px;
`;

export const ClearButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--tg-subtle);
  display: grid;
  place-items: center;
  cursor: pointer;
`;

export const HistoryDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--tg-surface);
  border: 1px solid var(--tg-border);
  border-top: none;
  border-radius: 12px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  z-index: 20;
  display: grid;
  gap: 4px;
  padding: 8px;
`;

export const HistoryButton = styled.button`
  text-align: left;
  border: none;
  background: transparent;
  color: var(--tg-text);
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.75;
`;

export const SearchButton = styled.button<{ $loading: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: var(--tg-accent-strong);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
`;
