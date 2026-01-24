import styled, { createGlobalStyle, css, keyframes } from "styled-components";

type OptionState = "normal" | "correct" | "wrong";

type SlotState = "empty" | "filled" | "correct" | "wrong";

type BannerTone = "info" | "danger";

const slotWiggle = keyframes`
  0% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
  100% { transform: translateX(0); }
`;

export const AudioPhraseGameGlobalStyles = createGlobalStyle`
  body[data-theme='light'] .apg-slot--empty {
    border-color: rgba(0, 0, 0, 0.35) !important;
    background: rgba(0, 0, 0, 0.03) !important;
  }

  body[data-theme='light'] .apg-word {
    border-color: rgba(0, 0, 0, 0.2) !important;
    background: rgba(0, 0, 0, 0.08) !important;
    color: #0b1b2b !important;
  }

  body[data-theme='light'] .apg-next {
    border-color: rgba(0, 0, 0, 0.25) !important;
    background: rgba(46, 163, 255, 0.18) !important;
    color: #0b1b2b !important;
  }
`;

export const TopSection = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 28px;
`;

export const LivesRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
`;

export const LifeHeart = styled.span<{ $active: boolean }>`
  opacity: ${({ $active }) => ($active ? 1 : 0.2)};
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const PhaseTitle = styled.div`
  text-align: center;
  font-weight: 500;
  font-size: 26px;
  height: 36px;
  max-height: 60px;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
`;

export const GameCard = styled.div`
  border-radius: 32px;
  background: #1f2b3a;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  height: calc(100% - 90px);
  margin: 20px auto;
  /* padding-bottom: 160px; */
`;

export const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const HeaderTitle = styled.div`
  font-weight: 700;
`;

export const RoundInfo = styled.div`
  color: var(--tg-subtle);
  font-size: 12px;
`;

export const InfoText = styled.div`
  color: var(--tg-subtle);
`;

export const StatusBanner = styled.div<{ $tone: BannerTone }>`
  padding: 16px;
  border-radius: 12px;
  font-weight: 700;
  text-align: center;
  color: var(--tg-text);
  background: ${({ $tone }) =>
    $tone === "danger" ? "rgba(255,107,107,0.12)" : "rgba(46, 163, 255, 0.08)"};
`;

export const QuestionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
`;

export const CenteredGrid = styled.div`
  display: grid;
  gap: 8px;
  justify-items: center;
`;

export const OptionButton = styled.button<{
  $state: OptionState;
  $shake?: boolean;
}>`
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--tg-border);
  background: ${({ $state }) =>
    $state === "correct"
      ? "rgba(53,199,89,0.18)"
      : $state === "wrong"
        ? "rgba(255,107,107,0.18)"
        : "var(--tg-border)"};
  color: var(--tg-text);
  cursor: ${({ $state }) => ($state === "normal" ? "pointer" : "default")};
  text-align: center;
  font-weight: 600;
  font-size: 18px;
  width: min(360px, 100%);
  animation: ${({ $shake }) =>
    $shake
      ? css`
          ${slotWiggle} 0.35s ease-in-out 2
        `
      : "none"};
`;

export const MissingSentence = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
  text-align: center;
  font-weight: 700;
  line-height: 1.6;
  font-size: 20px;
`;

export const MissingSlot = styled.span<{
  $correct?: boolean;
  $showCheck?: boolean;
  $shake?: boolean;
  $clickable?: boolean;
}>`
  display: inline-flex;
  min-width: 64px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  margin: 0 4px;
  border-radius: 8px;
  border: ${({ $showCheck, $correct }) =>
    $showCheck
      ? $correct
        ? "3px dashed rgba(53,199,89,0.9)"
        : "3px dashed rgba(255,107,107,0.9)"
      : "3px dashed rgba(76,196,255,0.55)"};
  background: rgba(255, 255, 255, 0.02);
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  line-height: 1.2;
  white-space: nowrap;
  animation: ${({ $shake }) =>
    $shake
      ? css`
          ${slotWiggle} 0.35s ease-in-out 2
        `
      : "none"};
`;

export const MissingOptionsRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 20px;
`;

export const OddWordOptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
`;

export const MissingOptionButton = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--tg-border);
  background: var(--tg-border);
  color: var(--tg-text);
  cursor: pointer;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  font-size: 18px;
  align-items: center;
`;

export const ResultSheet = styled.div<{ $visible: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 50px;
  padding: 14px 16px;
  border-radius: 32px 32px 0 0;
  background: rgba(18, 26, 40, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  gap: 10px;
  width: 100%;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.35);
  z-index: 20;
  transform: translateY(${({ $visible }) => ($visible ? "0" : "20px")});
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
  transition:
    transform 180ms ease,
    opacity 180ms ease;
`;

export const ResultMessage = styled.div<{ $success?: boolean }>`
  text-align: center;
  font-weight: 600;
  font-size: 22px;
  color: ${({ $success }) => ($success ? "#35c759" : "#ff6b6b")};
`;

export const ResultLine = styled.div`
  text-align: center;
  font-size: 18px;
  color: var(--tg-text);
  display: grid;
  gap: 4px;
`;

export const ResultLineEn = styled.div`
  font-weight: 700;
  font-size: 18px;
  color: var(--tg-text);
`;

export const ResultLineRu = styled.div`
  font-weight: 400;
  font-size: 18px;
  color: var(--tg-subtle);
`;

export const ResultActions = styled.div`
  display: flex;
  justify-content: center;
`;

export const CenteredRow = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: auto;
`;

export const NextButton = styled.button<{ $size?: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 18px;
  border-radius: 28px;
  border: none;
  background: rgba(76, 196, 255, 0.18);
  color: #e9f7ff;
  cursor: pointer;
  font-weight: 700;
  font-size: ${({ $size }) => ($size ? `${$size}px` : "22px")};
  width: 100%;
  max-width: 420px;
  align-self: stretch;
  margin-top: 18px;
`;

export const SlotWord = styled.span`
  cursor: grab;
`;

export const SlotRow = styled.div`
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 10px 0 6px;
`;

export const SlotBox = styled.div<{ $state: SlotState; $shake?: boolean }>`
  min-width: 72px;
  min-height: 32px;
  border-radius: 10px;
  border: ${({ $state }) =>
    $state === "correct"
      ? "3px dashed rgba(53,199,89,0.9)"
      : $state === "wrong"
        ? "3px dashed rgba(255,107,107,0.9)"
        : $state === "filled"
          ? "3px dashed var(--tg-accent)"
          : "3px dashed rgba(76,196,255,0.55)"};
  background-color: ${({ $state }) =>
    $state === "correct"
      ? "rgba(53,199,89,0.12)"
      : $state === "wrong"
        ? "rgba(255,107,107,0.12)"
        : $state === "filled"
          ? "rgba(76,196,255,0.1)"
          : "rgba(255,255,255,0.04)"};
  box-shadow: ${({ $state }) =>
    $state === "correct"
      ? "0 0 0 1px rgba(53,199,89,0.2)"
      : $state === "wrong"
        ? "0 0 0 1px rgba(255,107,107,0.2)"
        : $state === "filled"
          ? "0 0 0 1px rgba(76,196,255,0.25)"
          : "inset 0 0 0 1px rgba(255,255,255,0.04)"};
  display: grid;
  place-items: center;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  padding: 6px 10px;
  animation: ${({ $shake }) =>
    $shake
      ? css`
          ${slotWiggle} 0.35s ease-in-out 2
        `
      : "none"};
`;

export const AvailableWordsRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 6px 0 2px;
`;

export const WordChip = styled.div`
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  color: #e8f0ff;
  font-weight: 600;
  font-size: 18px;
  line-height: 1.2;
  white-space: nowrap;
  cursor: grab;
`;

export const FooterRow = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  width: 100%;
  margin-top: auto;
`;
