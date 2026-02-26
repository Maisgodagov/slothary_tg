import styled from "styled-components";

export const BannerWrapper = styled.div`
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 28px;
  background: var(--tg-card-strong);
  box-shadow: 0 1px 4px var(--tg-shadow-soft);
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
  border-style: solid;
  border-width: 3px;
  border-color: var(--tg-button-primary-border);
  border-radius: 24px;
  padding: 8px 14px;
  font-weight: 700;
  font-size: 14px;
  color: var(--tg-button-primary-text);
  background: var(--tg-button-primary-bg);
  box-shadow: 0 4px 0 var(--tg-button-primary-shadow), 0 8px 14px var(--tg-shadow-strong);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  &:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 var(--tg-button-primary-shadow), 0 4px 8px var(--tg-shadow-soft);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
    box-shadow: 0 4px 0 var(--tg-button-primary-shadow), 0 8px 14px var(--tg-shadow-strong);
  }
`;
