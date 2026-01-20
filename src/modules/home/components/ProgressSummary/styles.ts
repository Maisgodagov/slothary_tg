import styled from "styled-components";

export const ProgressSection = styled.div`
  display: grid;
  gap: 12px;
`;

export const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ProgressTitle = styled.div`
  font-weight: 700;
  font-size: 18px;
  color: var(--tg-text);
`;

export const ProgressLink = styled.button`
  border: none;
  background: transparent;
  color: #4da3ff;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
`;

export const ProgressCard = styled.div`
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #101524;
  padding: 10px;
  display: grid;
  align-items: center;

  [data-theme="light"] & {
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.08);
  }
`;

export const ProgressGrid = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ProgressItem = styled.div`
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 8px 0;
  flex: 1;
`;

export const ProgressDivider = styled.div`
  width: 1px;
  height: 54px;
  background: rgba(255, 255, 255, 0.08);
  justify-self: center;
  flex: 0 0 1px;
`;

export const ProgressValue = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: #eef3ff;

  [data-theme="light"] & {
    color: #1e293b;
  }
`;

export const ProgressLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(200, 210, 235, 0.55);

  [data-theme="light"] & {
    color: rgba(15, 23, 42, 0.45);
  }
`;

export const ProgressMuted = styled.div`
  color: var(--tg-subtle);
  font-size: 13px;
  text-align: center;
  padding: 8px 0 6px;

  [data-theme="light"] & {
    color: rgba(15, 23, 42, 0.55);
  }
`;

export const ProgressLabelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
