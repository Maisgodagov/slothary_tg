import styled from "styled-components";

export const ProgressSection = styled.div`
  display: grid;
  gap: 8px;
`;

export const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ProgressTitle = styled.div`
  font-weight: 700;
  font-size: 16px;
  color: var(--tg-text);
  padding-left: 6px;
`;

export const ProgressLink = styled.button`
  border: none;
  background: transparent;
  color: var(--tg-button-primary-bg);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  padding-right: 8px;
`;

export const ProgressCard = styled.button`
  border-radius: 28px;
  background: var(--tg-card-strong);
  padding: 8px;
  display: grid;
  align-items: center;
  box-shadow: 0 1px 4px var(--tg-shadow-soft);
  border: none;
  text-align: left;
  color: inherit;
  cursor: pointer;
`;

export const ProgressGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  justify-items: center;
  gap: 8px;
  width: 100%;
`;

export const ProgressItem = styled.div`
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 4px 0;
  width: 100%;
  text-align: center;
`;

export const ProgressDivider = styled.div`
  width: 1px;
  height: 44px;
  background: var(--tg-border);
  justify-self: center;
`;

export const ProgressValue = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: var(--tg-text);
  text-align: center;
  line-height: 0.95;
`;

export const ProgressLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tg-subtle);
  text-align: center;
  width: 100%;
`;

export const ProgressMuted = styled.div`
  color: var(--tg-subtle);
  font-size: 13px;
  text-align: center;
  padding: 8px 0 6px;
`;

export const ProgressLabelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
`;
