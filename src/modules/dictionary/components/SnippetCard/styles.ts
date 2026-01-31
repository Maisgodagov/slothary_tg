import styled from 'styled-components';

export const CardPlaceholder = styled.div<{ $compact?: boolean }>`
  width: ${({ $compact }) =>
    $compact ? "clamp(200px, 62vw, 260px)" : "clamp(220px, 72vw, 360px)"};
  height: ${({ $compact }) =>
    $compact ? "clamp(220px, 38vh, 300px)" : "clamp(260px, 52vh, 420px)"};
  border-radius: 22px;
  background: var(--tg-card);
  border: 1px solid var(--tg-border);
`;

export const CardShell = styled.div<{ $compact?: boolean }>`
  width: ${({ $compact }) =>
    $compact ? "clamp(200px, 62vw, 260px)" : "clamp(220px, 72vw, 360px)"};
  height: ${({ $compact }) =>
    $compact ? "clamp(220px, 38vh, 300px)" : "clamp(260px, 52vh, 420px)"};
  border-radius: 22px;
  overflow: hidden;
  background: #000;
  position: relative;
  scroll-snap-align: center;
  border: 1px solid var(--tg-border);
`;

export const FullVideoButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  border-radius: 999px;
  border: none;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 12px;
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
  display: grid;
  justify-items: center;
  text-align: center;
  color: #fff;
`;

export const ContextText = styled.div`
  background: rgba(0, 0, 0, 0.78);
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
`;

export const PlayButton = styled.button`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
`;

export const PlayIcon = styled.span`
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  font-size: 26px;
`;

export const Highlight = styled.span`
  color: #ffd54a;
  font-weight: 700;
`;

export const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.35);
`;
