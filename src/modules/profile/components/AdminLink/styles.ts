import styled from 'styled-components';

export const AdminLinkWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

export const AdminButton = styled.button`
  flex: 1;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  color: var(--tg-text);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 600;
  cursor: pointer;
`;
