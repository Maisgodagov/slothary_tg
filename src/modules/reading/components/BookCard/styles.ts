import styled from "styled-components";

export const Card = styled.button`
  border: 1px solid var(--tg-border);
  background: var(--tg-surface);
  color: var(--tg-text);
  border-radius: 16px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  min-height: 210px;
`;

export const Cover = styled.div<{ $url?: string | null }>`
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 12px;
  background: ${({ $url }) =>
    $url
      ? `linear-gradient(135deg, rgba(0,0,0,0.15), rgba(0,0,0,0.4)), url(${$url})`
      : "linear-gradient(135deg, #1a1f2b, #2c364d)"};
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

export const Title = styled.div`
  font-size: 15px;
  font-weight: 800;
  line-height: 1.2;
`;

export const Meta = styled.div`
  font-size: 12px;
  color: var(--tg-text-secondary);
`;

export const Progress = styled.div`
  margin-top: auto;
  font-size: 12px;
  color: var(--tg-text-secondary);
`;
