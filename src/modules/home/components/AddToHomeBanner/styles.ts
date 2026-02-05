import styled from "styled-components";

export const BannerWrapper = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 28px;
  background: var(--tg-card-strong);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  color: var(--tg-text);
  margin-bottom: 16px;
`;

export const BannerBody = styled.div`
  display: grid;
  gap: 6px;
  font-size: 15px;
  color: var(--tg-subtle);
`;

export const BannerTitle = styled.div`
  font-weight: 700;
  font-size: 18px;
  color: var(--tg-text);
`;

export const BannerAction = styled.button`
  width: 100%;
  border: none;
  border-radius: 18px;
  padding: 10px 18px;
  font-weight: 700;
  font-size: 17px;
  color: var(--tg-bg);
  background: var(--tg-accent);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
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
