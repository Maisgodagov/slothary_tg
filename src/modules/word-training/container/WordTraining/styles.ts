import styled from "styled-components";

export const TrainingPageRoot = styled.div<{ $homeVisible: boolean }>`
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: calc(
    100vh -
      (
        var(--tg-safe-area-inset-top) + var(--tg-content-safe-area-inset-top) +
          var(--tg-safe-area-inset-bottom)
      )
  );
  box-sizing: border-box;
  padding-bottom: ${({ $homeVisible }) => ($homeVisible ? "70px" : "70px")};
  overflow: ${({ $homeVisible }) => ($homeVisible ? "hidden" : "visible")};
`;

export const SessionHeaderWrap = styled.div`
  display: grid;
  gap: 10px;
`;

export const SectionCard = styled.div`
  border-radius: 22px;
`;

export const HomeLayout = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
  height: 100%;
`;

export const ProgressCard = styled.div`
  display: grid;
  gap: 10px;
  border-radius: 22px;
  padding: 12px;
  background: var(--tg-training-container-bg);
  border: 1px solid var(--tg-border);
  align-content: start;
  height: 148px;
  margin: 0;
`;

export const ProgressTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const CurrentBlockWrap = styled.div`
  flex: 0 1 75%;
  min-width: 0;
  display: grid;
  gap: 6px;
`;

export const CurrentBlockTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

export const CurrentBlockTitle = styled.div`
  color: var(--tg-text);
  font-size: 14px;
  font-weight: 600;
  min-width: 0;
`;

export const CurrentBlockCounter = styled.div`
  color: var(--tg-success);
  font-size: 16px;
  font-weight: 900;
  flex-shrink: 0;
`;

export const ProgressTrack = styled.div`
  height: 5px;
  border-radius: 999px;
  background: var(--tg-border);
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $width: number }>`
  width: ${({ $width }) => `${$width}%`};
  height: 100%;
  border-radius: 999px;
  background: var(--tg-accent);
  transition: width 240ms ease;
`;

export const LevelRingOuter = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--tg-border);
  flex-shrink: 0;
`;

export const LevelRingInner = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--tg-card);
  border: 1px solid var(--tg-border);
  font-size: 12px;
  font-weight: 900;
  color: var(--tg-text);
`;

export const LearnButtonLabel = styled.span`
  display: grid;
  gap: 2px;
  line-height: 1.05;
  text-align: center;
`;

export const LearnButtonSub = styled.span`
  font-size: 13px;
  font-weight: 600;
  opacity: 0.9;
`;

export const MasteryArea = styled.div`
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  overflow: hidden;
`;

export const MasteryGridCard = styled.div<{ $fillHeight: boolean }>`
  border-radius: 20px;
  display: grid;
  flex: ${({ $fillHeight }) => ($fillHeight ? "1 1 auto" : "0 0 auto")};
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--tg-border);
  background: var(--tg-training-container-bg);
  height: ${({ $fillHeight }) => ($fillHeight ? "100%" : "auto")};
  min-height: ${({ $fillHeight }) => ($fillHeight ? "0" : "auto")};
  overflow-y: ${({ $fillHeight }) => ($fillHeight ? "auto" : "visible")};
  margin: ${({ $fillHeight }) => ($fillHeight ? "0" : "0 0 14px 0")};
`;

export const LevelHeaderRow = styled.div`
  position: relative;
  min-height: 24px;
`;

export const LevelHeaderTitle = styled.div`
  font-size: 17px;
  font-weight: 800;
  text-align: center;
`;

export const LevelHeaderCounter = styled.div`
  font-size: 12px;
  color: var(--tg-subtle);
  font-weight: 700;
  position: absolute;
  right: 0;
  top: 3px;
`;
