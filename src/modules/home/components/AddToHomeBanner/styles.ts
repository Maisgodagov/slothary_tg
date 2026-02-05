import styled from "styled-components";

export const BannerWrapper = styled.div`
  display: grid;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(56, 189, 248, 0.18),
    rgba(14, 116, 144, 0.12)
  );
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: var(--tg-text);
  margin-bottom: 16px;
`;

export const BannerBody = styled.div`
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: var(--tg-subtle);
`;

export const BannerTitle = styled.div`
  font-weight: 700;
  font-size: 15px;
  color: var(--tg-text);
`;

export const BannerAction = styled.button`
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 700;
  font-size: 13px;
  color: var(--tg-text);
  background: var(--tg-card-strong);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.1);
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
