import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  z-index: 50;
  padding: 16px;
`;

export const Modal = styled.div`
  width: min(360px, 92vw);
  background: var(--tg-surface);
  border: 1px solid var(--tg-border);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 12px;
  color: var(--tg-text);
`;

export const Title = styled.div`
  font-weight: 700;
  font-size: 16px;
`;

export const Description = styled.div`
  color: var(--tg-subtle);
  font-size: 13px;
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export const CancelButton = styled.button`
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  color: var(--tg-text);
  font-weight: 600;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
`;

export const ConfirmButton = styled.button`
  border: none;
  background: var(--tg-danger);
  color: #fff;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
`;
