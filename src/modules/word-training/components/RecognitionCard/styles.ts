import styled from 'styled-components';

export const Card = styled.div`
  display: grid;
  gap: 12px;
  border-radius: 22px;
`;

export const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export const HeaderTitle = styled.strong`
  font-size: 25px;
  line-height: 1.15;
  font-weight: 600;
`;

export const WordRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const WordText = styled.div`
  font-size: 34px;
  font-weight: 800;
  line-height: 1.1;
`;

export const PronButton = styled.button<{ $enabled: boolean }>`
  width: 42px;
  height: 42px;
  border-radius: 16px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  color: var(--tg-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $enabled }) => ($enabled ? 1 : 0.45)};
`;

export const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 18px;
`;
