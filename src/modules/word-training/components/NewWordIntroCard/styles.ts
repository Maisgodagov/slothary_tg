import styled from 'styled-components';

export const Card = styled.div`
  display: grid;
  gap: 14px;
  border-radius: 22px;
`;

export const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
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

export const Dash = styled.span`
  color: var(--tg-subtle);
  font-weight: 700;
`;

export const TranslationText = styled.span`
  font-size: 30px;
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
  flex-shrink: 0;
`;

export const CefrBadge = styled.div`
  width: fit-content;
  border-radius: 999px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 800;
  color: var(--tg-subtle);
`;

export const OtherWrap = styled.div`
  display: grid;
  gap: 6px;
`;

export const OtherLabel = styled.div`
  color: var(--tg-subtle);
  font-size: 12px;
  font-weight: 700;
`;

export const OtherText = styled.div`
  color: var(--tg-subtle);
  font-size: 14px;
  line-height: 1.45;
`;
