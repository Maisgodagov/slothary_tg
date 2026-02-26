import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--tg-overlay);
  display: grid;
  place-items: center;
  z-index: 50;
`;

export const Modal = styled.div`
  width: min(360px, 92vw);
  background: var(--tg-card);
  border: 1px solid var(--tg-border);
  border-radius: 16px;
  padding: 16px;
  color: var(--tg-text);
  display: grid;
  gap: 10px;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ModalTitle = styled.div`
  font-weight: 700;
`;

export const CloseButton = styled.button`
  border: none;
  background: transparent;
  color: var(--tg-text);
  cursor: pointer;
`;

export const Message = styled.div`
  color: var(--tg-subtle);
  font-size: 14px;
`;
