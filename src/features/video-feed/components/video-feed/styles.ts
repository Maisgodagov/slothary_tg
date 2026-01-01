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

export const Player = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  aspect-ratio: 9 / 16;
`;

export const TopRightStack = styled.div`
  position: absolute;
  right: calc(12px + var(--safe-right));
  top: calc(50% + 78px);
  display: flex;
  flex-direction: column;
  gap: 6px;
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

export const Subtitles = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px calc(18px + var(--safe-bottom));
  color: #fff;
  display: grid;
  gap: 6px;
  align-items: center;
  justify-items: center;
  text-align: center;
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

export const Progress = styled.input<{ $thin?: boolean }>`
  width: 100%;
  height: ${({ $thin }) => ($thin ? "4px" : "10px")};
  accent-color: #2607c2ff;
  z-index: 556;
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
  min-width: 72px;
  height: 64px;
  padding: 10px 12px;
  border-radius: 18px;
  backdrop-filter: none;
  background: transparent;
  border: none;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

export const LikeButton = styled.button`
  min-width: 72px;
  height: 80px;
  padding: 6px 12px;
  border-radius: 18px;
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
`;
