import styled from 'styled-components';

export const CardButton = styled.button`
  border-radius: 16px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  padding: 16px;
  display: grid;
  gap: 8px;
  text-align: left;
  color: var(--tg-text);
  cursor: pointer;
`;

export const CardTitle = styled.div`
  font-weight: 700;
`;

export const CardDescription = styled.div`
  color: var(--tg-subtle);
  font-size: 13px;
`;
