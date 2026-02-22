import styled from 'styled-components';

export const PraiseCard = styled.div`
  display: grid;
  gap: 14px;
  min-height: calc(100svh - 170px);
  align-content: start;
  border-radius: 24px;
  padding: 16px;
  background: var(--tg-card);
  border: 1px solid var(--tg-border);
`;

export const PraiseTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const PraiseIcon = styled.span`
  font-size: 28px;
  line-height: 1;
`;

export const PraiseTitle = styled.div`
  font-size: 28px;
  font-weight: 900;
  line-height: 1.05;
`;

export const PraiseText = styled.div`
  color: var(--tg-subtle);
  font-size: 15px;
  line-height: 1.35;
`;

export const PraiseMeta = styled.div`
  color: var(--tg-subtle);
  font-size: 14px;
  font-weight: 700;
`;
