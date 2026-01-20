import styled from 'styled-components';

export const AuthCardWrapper = styled.div`
  width: 100%;
  max-width: 560px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  display: grid;
  gap: 12px;
`;

export const ModeRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const HintText = styled.div`
  font-size: 12px;
  color: var(--tg-subtle);
`;
