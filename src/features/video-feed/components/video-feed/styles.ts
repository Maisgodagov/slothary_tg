import styled from "styled-components";
import { Button } from "../../../../shared/ui/Button";

export const FeedContainer = styled.div<{ $navOffset: number }>`
  height: calc(100vh - var(--safe-bottom) - ${({ $navOffset }) => $navOffset}px);
  padding: 0;
`;

export const FeedScroll = styled.div<{ $navOffset: number }>`
  display: grid;
  gap: 0;
  height: calc(100vh - var(--safe-bottom) - ${({ $navOffset }) => $navOffset}px);
  overflow-y: auto;
  padding: 0;
  scroll-snap-type: y mandatory;
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
  top: calc(12px + var(--safe-top));
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const LikeWrapper = styled.div`
  position: absolute;
  right: calc(12px + var(--safe-right));
  top: 50%;
  transform: translateY(-50%);
`;

export const TagsRow = styled.div`
  position: absolute;
  top: calc(6px + var(--safe-top));
  left: calc(12px + var(--safe-left));
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: rgba(109, 211, 255, 0.14);
  border: 1px solid rgba(109, 211, 255, 0.4);
  color: var(--tg-accent);
  backdrop-filter: blur(4px);
`;

export const Subtitles = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 14px 16px calc(20px + var(--safe-bottom));
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.08) 100%);
  color: #fff;
  display: grid;
  gap: 6px;
`;

export const SubtitleLine = styled.div<{ $secondary?: boolean }>`
  font-weight: ${({ $secondary }) => ($secondary ? 700 : 800)};
  font-size: ${({ $secondary }) => ($secondary ? "22px" : "24px")};
  color: ${({ $secondary }) => ($secondary ? "#d8e4ff" : "#fff")};
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.95);
  background: rgba(0, 0, 0, 0.6);
  padding: 8px 10px;
  border-radius: 10px;
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
`;

export const Progress = styled.input`
  width: 100%;
`;

export const TapIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 72px;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.9);
`;

export const IconButton = styled(Button)`
  min-width: 64px;
  height: 48px;
  padding: 10px 12px;
  border-radius: 16px;
  backdrop-filter: blur(6px);
`;

export const LikeButton = styled(Button)`
  min-width: 72px;
  height: 64px;
  padding: 12px 14px;
  border-radius: 18px;
  backdrop-filter: blur(6px);
  font-size: 20px;
`;
