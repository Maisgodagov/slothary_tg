import styled from "styled-components";

export const FeedContainer = styled.div<{ $navOffset: number }>`
  height: calc(
    100vh - var(--safe-bottom) - ${({ $navOffset }) => $navOffset}px
  );
  padding: 0;
`;

export const FeedScroll = styled.div<{ $navOffset: number }>`
  display: grid;
  gap: 0;
  height: calc(
    100vh - var(--safe-bottom) - ${({ $navOffset }) => $navOffset}px
  );
  overflow-y: auto;
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
  width: ${({ $shrink }) => ($shrink ? '80vw' : '100%')};
  max-width: ${({ $shrink }) => ($shrink ? '480px' : '100%')};
  height: ${({ $shrink }) => ($shrink ? '52vh' : '100%')};
  max-height: ${({ $shrink }) => ($shrink ? '52vh' : '100%')};
  object-fit: cover;
  aspect-ratio: 9 / 16;
  border-radius: ${({ $shrink }) => ($shrink ? '18px' : '0px')};
  overflow: hidden;
  transition: height 0.24s ease, max-height 0.24s ease, border-radius 0.24s ease,
    transform 0.24s ease, width 0.24s ease, max-width 0.24s ease, margin 0.24s ease;
  transform: ${({ $shrink }) => ($shrink ? 'translateY(0)' : 'translateY(0)')};
  margin: ${({ $shrink }) => ($shrink ? '0 auto' : '0')};
`;

export const TopRightStack = styled.div<{ $withSheet?: boolean }>`
  position: absolute;
  right: calc(12px + var(--safe-right));
  top: ${({ $withSheet }) =>
    $withSheet ? '18%' : 'calc(50% + 170px)'};
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: top 0.24s ease;
  z-index: 140;
`;

export const SettingsButton = styled.button`
  position: absolute;
  right: calc(8px + var(--safe-right));
  top: calc(var(--safe-top));
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
  top: calc(var(--safe-top) + 0px);
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
  bottom: ${({ $withSheet }) => ($withSheet ? '40vh' : '0')};
  padding: 12px 16px calc(18px + var(--safe-bottom));
  color: #fff;
  display: grid;
  gap: 6px;
  align-items: center;
  justify-items: center;
  text-align: center;
  pointer-events: none;
`;

export const SubtitleLine = styled.div<{ $secondary?: boolean }>`
  font-weight: ${({ $secondary }) => ($secondary ? 600 : 700)};
  font-size: ${({ $secondary }) => ($secondary ? "22px" : "24px")};
  color: ${({ $secondary }) => ($secondary ? "#d8e4ff" : "#fff")};
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.95);
  background: ${({ $secondary }) =>
    $secondary ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.85)"};
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
  bottom: calc(var(--safe-bottom) + var(--nav-height) - 13px);
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
    background: transparent;
  }

  &::-moz-range-track {
    height: ${({ $thin }) => ($thin ? "4px" : "10px")};
    border-radius: 999px;
    background: transparent;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: ${({ $showThumb }) => ($showThumb ? "24px" : "0px")};
    height: ${({ $showThumb }) => ($showThumb ? "24px" : "0px")};
    border-radius: 50%;
    z-index: 5000;
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
    z-index: 5000;

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

export const TapOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

export const IconButton = styled.button`
  min-width: 76px;
  height: 72px;
  padding: 12px 14px;
  border-radius: 20px;
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
  min-width: 78px;
  height: 88px;
  padding: 8px 14px;
  border-radius: 20px;
  backdrop-filter: none;
  font-size: 18px;
  background: transparent;
  border: none;
  color: #fff;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  cursor: pointer;
  svg {
    filter: drop-shadow(0 1px 6px rgba(0, 0, 0, 0.65));
  }
  span {
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.65);
  }
`;

export const ExerciseButton = styled.button`
  min-width: 78px;
  height: 78px;
  padding: 10px 12px;
  border-radius: 20px;
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

export const ExerciseSheet = styled.div<{ $open: boolean }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0 auto;
  max-width: 960px;
  height: 48vh;
  min-height: 320px;
  background: linear-gradient(180deg, #121523 0%, #0d0f1a 100%);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -12px 30px rgba(0, 0, 0, 0.45);
  z-index: 130;
  padding: 16px 16px calc(12px + var(--safe-bottom));
  display: flex;
  flex-direction: column;
  gap: 14px;
  transform: translateY(${({ $open }) => ($open ? '0%' : '110%')});
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: transform 0.24s ease, opacity 0.24s ease;
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
`;

export const ExerciseHandle = styled.div`
  width: 52px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  margin: 0 auto;
`;

export const ExerciseTitle = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: #f5f7ff;
  text-align: center;
`;

export const ExercisePlaceholder = styled.div`
  flex: 1;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  color: #cfd3e0;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 16px;
  font-weight: 600;
  line-height: 1.4;
`;
