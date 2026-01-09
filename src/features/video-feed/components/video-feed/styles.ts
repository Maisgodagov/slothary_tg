import styled from "styled-components";

export const FeedContainer = styled.div<{ $navOffset: number }>`
  height: calc(
    100vh - var(--tg-content-safe-area-inset-top) - var(--tg-content-safe-area-inset-bottom)
  );
  padding: 0;
  overflow: hidden;
`;

export const FeedScroll = styled.div<{ $navOffset: number; $locked?: boolean }>`
  display: grid;
  gap: 0;
  height: calc(
    100vh - var(--tg-content-safe-area-inset-top) - var(--tg-content-safe-area-inset-bottom) -
      ${({ $navOffset }) => $navOffset}px
  );
  overflow-y: ${({ $locked }) => ($locked ? "hidden" : "auto")};
  padding: 0;
  scroll-snap-type: y mandatory;
  overscroll-behavior-y: contain;
`;

export const ErrorText = styled.div`
  color: var(--tg-danger);
  margin-bottom: 8px;
  font-weight: 600;
`;

export const HelperText = styled.div`
  margin-top: 8px;
  text-align: center;
  color: var(--tg-subtle);
  font-size: 12px;
`;

export const EmptyState = styled.div`
  display: grid;
  gap: 10px;
  justify-items: center;
  padding: 24px 16px;
  color: var(--tg-text);
  text-align: center;
`;

export const EmptyTitle = styled.div`
  font-size: 18px;
  font-weight: 800;
`;

export const EmptyText = styled.div`
  font-size: 14px;
  color: var(--tg-subtle);
  max-width: 320px;
`;

export const EmptyButton = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  color: var(--tg-text);
  font-weight: 700;
  cursor: pointer;
`;

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

export const ModalCard = styled.div`
  width: 100%;
  max-width: 520px;
  background: var(--tg-surface, #0f1428);
  color: var(--tg-text, #e9edf7);
  border-radius: 18px;
  padding: 20px 18px 18px;
  border: 1px solid var(--tg-border, #2b3245);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  display: grid;
  gap: 12px;
  position: relative;
`;

export const ModalTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
`;

export const ModalText = styled.div`
  font-size: 14px;
  color: var(--tg-subtle, #cfd5e4);
  line-height: 1.5;
`;

export const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  flex-wrap: wrap;
`;

export const ModalButton = styled.button<{ $primary?: boolean }>`
  padding: 10px 14px;
  border-radius: 12px;
  border: ${({ $primary }) =>
    $primary ? "none" : "1px solid var(--tg-border, #30384a)"};
  background: ${({ $primary }) =>
    $primary ? "#0f7aa7" : "var(--tg-card, #1f273b)"};
  color: ${({ $primary }) => ($primary ? "#fff" : "var(--tg-text, #e9edf7)")};
  font-weight: 700;
  cursor: pointer;
`;

export const ModalClose = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 12px;
  border: 1px solid var(--tg-border, #30384a);
  background: var(--tg-card, #1f273b);
  color: var(--tg-text, #e9edf7);
  font-size: 18px;
  cursor: pointer;
`;

export const Sentinel = styled.div`
  height: 12px;
  width: 100%;
`;

export const Card = styled.div<{ $cardHeight: string; $maxHeight: string }>`
  position: relative;
  background: #000;
  border-radius: 0;
  overflow: hidden;
  height: ${({ $cardHeight }) => $cardHeight};
  max-height: ${({ $maxHeight }) => $maxHeight};
  width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
`;

export const Player = styled.video<{ $shrink?: boolean }>`
  display: block;
  width: ${({ $shrink }) => ($shrink ? "60vw" : "100%")};
  max-width: ${({ $shrink }) => ($shrink ? "430px" : "100%")};
  height: ${({ $shrink }) => ($shrink ? "calc(100% - 296px)" : "100%")};
  max-height: ${({ $shrink }) => ($shrink ? "calc(100% - 296px)" : "100%")};
  object-fit: cover;
  aspect-ratio: 9 / 16;
  border-radius: ${({ $shrink }) => ($shrink ? "18px" : "0px")};
  overflow: hidden;
  transition: height 0.24s ease, max-height 0.24s ease, border-radius 0.24s ease,
    transform 0.24s ease, width 0.24s ease, max-width 0.24s ease,
    margin 0.24s ease;
  transform: ${({ $shrink }) => ($shrink ? "translateY(0)" : "translateY(0)")};
  margin: ${({ $shrink }) => ($shrink ? "0 auto" : "0")};
`;

export const TopRightStack = styled.div<{ $withSheet?: boolean }>`
  position: absolute;
  right: calc(var(--safe-right) + 10px);
  top: ${({ $withSheet }) => ($withSheet ? "18%" : "45%")};
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition: top 0.24s ease;
  z-index: 140;
`;

export const SettingsButton = styled.button`
  position: absolute;
  right: calc(8px + var(--safe-right));
  top: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 14px;
  border: none;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  backdrop-filter: blur(6px);
  cursor: pointer;
  outline: none;
`;

export const LikeWrapper = styled.div`
  position: absolute;
  right: calc(12px + var(--safe-right));
  top: 50%;
  transform: translateY(-50%);
`;

export const ExerciseWrapper = styled.div`
  position: absolute;
  right: calc(12px + var(--safe-right));
  top: calc(50% + 90px);
  transform: translateY(-50%);
`;

export const TagsRow = styled.div`
  position: absolute;
  top: 6px;
  left: calc(12px + var(--safe-left));
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  max-width: 85%;
  overflow-x: auto;
  white-space: nowrap;
  padding-right: 8px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 14px;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.75);
  color: #ffffff;
  font-weight: 700;
`;

export const Subtitles = styled.div<{ $withSheet?: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  bottom: ${({ $withSheet }) => ($withSheet ? "39vh" : "0")};
  padding: 12px 16px calc(18px + var(--safe-bottom));
  color: #fff;
  display: grid;
  gap: 10px;
  align-items: center;
  justify-items: center;
  text-align: center;
  pointer-events: auto;
`;

export const SubtitleLine = styled.div<{ $secondary?: boolean }>`
  font-weight: ${({ $secondary }) => ($secondary ? 400 : 500)};
  font-size: ${({ $secondary }) => ($secondary ? "18px" : "18px")};
  color: ${({ $secondary }) => ($secondary ? "#d8e4ff" : "#fff")};
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.95);
  background: ${({ $secondary }) =>
    $secondary ? "rgba(0, 0, 0, 0.95)" : "rgba(0, 0, 0, 0.95)"};
  padding: 8px 12px;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
  margin: 0 auto;
`;

export const SubtitleLoading = styled.div`
  color: #cfd3e0;
  font-size: 12px;
`;

export const EditSubtitleButton = styled.button`
  position: absolute;
  top: -10px;
  left: calc(18px + var(--safe-left));
  border: none;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  border-radius: 12px;
  padding: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  z-index: 200;
  pointer-events: auto;
`;

export const Controls = styled.div`
  display: grid;
  gap: 8px;
  position: relative;
  align-items: center;
`;

export const SeekContainer = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  margin: 0 auto;
  max-width: 960px;
  bottom: calc(var(--safe-bottom) + var(--nav-height) - 22px);
  padding: 0 0px;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 120;
  pointer-events: auto;
`;

export const SeekTimes = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  padding: 0 4px;
`;

export const Progress = styled.input<{ $thin?: boolean; $showThumb?: boolean }>`
  width: 100%;
  height: ${({ $thin }) => ($thin ? "4px" : "10px")};
  appearance: none;
  background: #ffffff33;
  border-radius: 999px;
  border: none;
  padding: 0;
  margin: 0;
  outline: none;
  pointer-events: auto;

  &::-webkit-slider-runnable-track {
    height: ${({ $thin }) => ($thin ? "4px" : "10px")};
    border-radius: 999px;
    z-index: 9999;

    background: transparent;
  }

  &::-moz-range-track {
    height: ${({ $thin }) => ($thin ? "4px" : "10px")};
    border-radius: 999px;
    z-index: 9999;
    background: transparent;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: ${({ $showThumb }) => ($showThumb ? "24px" : "0px")};
    height: ${({ $showThumb }) => ($showThumb ? "24px" : "0px")};
    border-radius: 50%;
    z-index: 99000;
    background: ${({ $showThumb }) => ($showThumb ? "#ffffff" : "transparent")};
    border: ${({ $showThumb }) => ($showThumb ? "3px solid #2ea3ff" : "none")};
    box-shadow: ${({ $showThumb }) =>
      $showThumb ? "0 2px 10px rgba(0, 0, 0, 0.35)" : "none"};
    margin-top: ${({ $thin }) => ($thin ? "-11px" : "-6px")};
    transition: width 0.1s ease, height 0.1s ease, margin-top 0.1s ease;
  }

  &::-moz-range-thumb {
    width: ${({ $showThumb }) => ($showThumb ? "24px" : "0px")};
    height: ${({ $showThumb }) => ($showThumb ? "24px" : "0px")};
    border-radius: 50%;
    z-index: 999000;

    background: ${({ $showThumb }) => ($showThumb ? "#ffffff" : "transparent")};
    border: ${({ $showThumb }) => ($showThumb ? "3px solid #2ea3ff" : "none")};
    box-shadow: ${({ $showThumb }) =>
      $showThumb ? "0 2px 10px rgba(0, 0, 0, 0.35)" : "none"};
    transition: width 0.1s ease, height 0.1s ease;
  }
`;

export const TapIndicator = styled.div`
  font-size: 72px;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.9);
`;

export const TapOverlay = styled.div<{ $shrink?: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: ${({ $shrink }) => ($shrink ? "48vh" : "100%")};
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

export const SpinnerOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
`;

export const IconButton = styled.button`
  backdrop-filter: none;
  background: transparent;
  border: none;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  svg {
    filter: drop-shadow(0 1px 6px rgba(0, 0, 0, 0.65));
  }
`;

export const LikeButton = styled.button`
  backdrop-filter: none;
  font-size: 18px;
  background: transparent;
  border: none;
  color: #fff;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  svg {
    filter: drop-shadow(0 1px 6px rgba(0, 0, 0, 0.65));
  }
  span {
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.65);
  }
`;

export const ExerciseButton = styled.button`
  background: transparent;
  border: none;
  color: #fff;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  backdrop-filter: none;
  box-shadow: none;
  svg {
    filter: drop-shadow(0 1px 6px rgba(0, 0, 0, 0.65));
  }
  span {
    font-weight: 700;
    font-size: 12px;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.65);
  }
`;

export const ModerationButton = styled.button<{ $approved?: boolean }>`
  background: transparent;
  border: none;
  color: ${({ $approved }) => ($approved ? "#3ec985" : "#fff")};
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  padding: 0;
  svg {
    filter: drop-shadow(0 1px 6px rgba(0, 0, 0, 0.65));
  }
`;

export const ExerciseSheet = styled.div<{ $open: boolean }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 53px;
  margin: 0 auto;
  max-width: 960px;
  height: 300px;
  background: var(--tg-card, #0f1428);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -12px 30px rgba(0, 0, 0, 0.3);
  z-index: 130;
  padding: 4px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transform: translateY(${({ $open }) => ($open ? "0%" : "110%")});
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: transform 0.24s ease, opacity 0.24s ease;
  pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
`;

export const ExerciseOverlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 125;
  pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
`;

export const ExerciseHandle = styled.div`
  width: 52px;
  height: 4px;
  border-radius: 999px;
  background: var(--tg-border, rgba(255, 255, 255, 0.14));
  margin: 4px auto 0;
`;

export const ExerciseTitle = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: var(--tg-text, #e9edf7);
  text-align: center;
`;

export const ExercisePlaceholder = styled.div`
  flex: 1;
  border-radius: 14px;
  background: var(--tg-surface, #121a2a);
  border: 1px dashed var(--tg-border, #2b3245);
  color: var(--tg-text, #e9edf7);
  display: grid;
  place-items: center;
  text-align: center;
  padding: 16px;
  font-weight: 600;
  line-height: 1.4;
`;

export const ExerciseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-right: 4px;
`;

export const ExerciseCard = styled.div`
  background: var(--tg-surface, #121a2a);
  border: 1px solid var(--tg-border, #2b3245);
  border-radius: 14px;
  padding: 14px 12px;
  display: grid;
  gap: 8px;
`;

export const ExercisePrompt = styled.div`
  font-weight: 600;
  color: var(--tg-text, #e9edf7);
  font-size: 26px;
  justify-content: center;
  display: flex;
  width: 100%;
`;

export const ExerciseMeta = styled.div`
  font-size: 12px;
  color: var(--tg-subtle, #cfd5e4);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const ExerciseOptions = styled.div`
  display: grid;
  gap: 10px;
`;

export const ExerciseOption = styled.button<{
  $state?: "neutral" | "correct" | "wrong";
}>`
  width: 100%;
  padding: 14px 14px;
  border-radius: 14px;
  border: 1px solid
    ${({ $state }) =>
      $state === "correct"
        ? "rgba(91, 214, 145, 0.7)"
        : $state === "wrong"
        ? "rgba(255, 95, 109, 0.7)"
        : "var(--tg-border)"};
  background: ${({ $state }) =>
    $state === "correct"
      ? "rgba(91, 214, 145, 0.12)"
      : $state === "wrong"
      ? "rgba(255, 95, 109, 0.12)"
      : "var(--tg-surface, #121a2a)"};
  color: var(--tg-text, #e9edf7);
  font-weight: 700;
  font-size: 20px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
`;

export const ListenButton = styled.button`
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: var(--tg-border, #2b3245);
  color: var(--tg-text, #e9edf7);
  cursor: pointer;
  svg {
    filter: none;
  }
  box-shadow: none;
`;
