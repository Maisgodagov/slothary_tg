import styled from 'styled-components';

export const CardButton = styled.button`
  border-radius: 16px;
  border: none;
  background: var(--tg-card-strong);
  padding: 16px;
  display: grid;
  gap: 8px;
  text-align: left;
  color: var(--tg-text);
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
`;

export const CardTitle = styled.div`
  font-weight: 700;
`;

export const CardDescription = styled.div`
  color: var(--tg-subtle);
  font-size: 13px;
`;
