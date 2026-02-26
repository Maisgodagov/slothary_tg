import styled from "styled-components";

export const CardPlaceholder = styled.div<{ $compact?: boolean }>`
  width: ${({ $compact }) =>
    $compact ? "clamp(218px, 69vw, 292px)" : "clamp(252px, 82vw, 388px)"};
  height: ${({ $compact }) =>
    $compact ? "clamp(210px, 36vh, 290px)" : "clamp(250px, 50vh, 400px)"};
  border-radius: 24px;
  background: var(--tg-card);
  border: 3px solid var(--tg-surface);
  box-shadow: inset 0 0 0 1px var(--tg-border);
`;

export const CardShell = styled.div<{ $compact?: boolean }>`
  width: ${({ $compact }) =>
    $compact ? "clamp(218px, 69vw, 292px)" : "clamp(252px, 82vw, 388px)"};
  height: ${({ $compact }) =>
    $compact ? "clamp(210px, 36vh, 290px)" : "clamp(250px, 50vh, 400px)"};
  border-radius: 25px;
  overflow: hidden;
  background: var(--tg-media-bg);
  position: relative;
  scroll-snap-align: center;
  border: 3px solid var(--tg-surface);
  box-shadow: inset 0 0 0 1px var(--tg-border);
`;

export const FullVideoButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  border-radius: 999px;
  border: none;
  padding: 6px 10px;
  background: var(--tg-video-overlay-bg);
  color: var(--tg-video-overlay-text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`;

export const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const ContextWrapper = styled.div`
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 16px;
  z-index: 3;
  display: grid;
  justify-items: center;
  text-align: center;
  color: var(--tg-video-overlay-text);
  pointer-events: auto;
`;

export const ContextText = styled.div`
  background: var(--tg-video-overlay-bg);
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
`;

export const ContextWordButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
`;

export const PlayButton = styled.button<{ $interactive?: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  background: transparent;
  border: none;
  color: var(--tg-video-overlay-text);
  pointer-events: ${({ $interactive }) => ($interactive ? "auto" : "none")};
`;

export const PlayIcon = styled.span`
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--tg-overlay);
  display: grid;
  place-items: center;
  font-size: 26px;
`;

export const PlayCta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--tg-video-overlay-text) 30%, transparent);
  background: var(--tg-video-overlay-bg);
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  color: var(--tg-video-overlay-text);
`;

export const Highlight = styled.span`
  color: var(--tg-highlight);
  font-weight: 700;
`;

export const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: var(--tg-overlay);
`;
