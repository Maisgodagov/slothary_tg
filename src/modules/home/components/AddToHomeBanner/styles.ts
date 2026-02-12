import styled from "styled-components";

export const BannerWrapper = styled.div`
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 28px;
  background: var(--tg-card-strong);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  color: var(--tg-text);
`;

export const BannerBody = styled.div`
  display: grid;
  gap: 4px;
  font-size: 14px;
  color: var(--tg-subtle);
`;

export const BannerTitle = styled.div`
  font-weight: 700;
  font-size: 16px;
  color: var(--tg-text);
`;

export const BannerAction = styled.button`
  width: auto;
  justify-self: end;
  border: 1px solid var(--tg-border);
  border-radius: 14px;
  padding: 8px 14px;
  font-weight: 600;
  font-size: 14px;
  color: var(--tg-text);
  background: var(--tg-card);
  box-shadow: none;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
    box-shadow: none;
  }
`;
