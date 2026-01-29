import styled from "styled-components";

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

export const Card = styled.div`
  width: 100%;
  max-width: 520px;
  background: var(--tg-surface);
  border-radius: 18px;
  border: 1px solid var(--tg-border);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Title = styled.div`
  font-size: 18px;
  font-weight: 800;
`;

export const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--tg-text);
`;

export const Input = styled.input`
  border-radius: 12px;
  border: 1px solid var(--tg-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--tg-text);
  padding: 10px 12px;
  font-size: 14px;
`;

export const Textarea = styled.textarea`
  border-radius: 12px;
  border: 1px solid var(--tg-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--tg-text);
  padding: 10px 12px;
  font-size: 14px;
  min-height: 90px;
  resize: vertical;
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export const Button = styled.button<{ $primary?: boolean }>`
  border-radius: 12px;
  border: 1px solid var(--tg-border);
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
  background: ${({ $primary }) =>
    $primary ? "linear-gradient(135deg, #2ea3ff, #6dd3ff)" : "transparent"};
  color: ${({ $primary }) => ($primary ? "#0c1021" : "var(--tg-text)")};
`;

export const Hint = styled.div`
  font-size: 12px;
  color: var(--tg-text-secondary);
`;
