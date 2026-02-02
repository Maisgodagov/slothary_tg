import styled from "styled-components";

export const ReaderShell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--tg-bg);
  min-height: 0;
`;

export const ReaderHeader = styled.div`
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
`;

export const BackButton = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--tg-text);
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

export const HeaderTitle = styled.div`
  text-align: center;
  font-size: 11px;
  letter-spacing: 1px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
`;

export const FontButton = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--tg-text);
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 700;
`;

export const ReaderProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 8px;
`;

export const ProgressBar = styled.div`
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #2ea3ff, #6dd3ff);
  }
`;

export const ProgressText = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
`;

export const ReaderBody = styled.div`
  flex: 1;
  overflow: hidden;
  padding: 12px 18px 44px;
  min-height: 0;
`;

export const Paragraph = styled.p`
  margin: 0 0 18px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
`;

export const Word = styled.span`
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: #6dd3ff;
  }
`;

export const ReaderFooter = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--tg-bg);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

export const FooterButton = styled.button`
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
`;

export const PageIndicator = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
`;

export const FontPanel = styled.div`
  position: fixed;
  right: 12px;
  top: 64px;
  background: rgba(20, 30, 50, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 14px 16px;
  display: grid;
  gap: 8px;
  width: 180px;
`;

export const FontLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
`;

export const Range = styled.input`
  width: 100%;
`;

export const Popover = styled.div<{ $top: number; $left: number; $width: number; $placement: "top" | "bottom" }>`
  position: fixed;
  left: ${({ $left }) => `${$left}px`};
  top: ${({ $top }) => `${$top}px`};
  transform: ${({ $placement }) =>
    $placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)"};
  width: ${({ $width }) => `${$width}px`};
  background: var(--tg-surface);
  border: 1px solid var(--tg-border);
  border-radius: 16px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35);
  padding: 12px;
  z-index: 1400;
`;

export const PopoverActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`;

export const PopoverButton = styled.button<{ $primary?: boolean }>`
  border-radius: 10px;
  border: 1px solid var(--tg-border);
  padding: 8px 10px;
  font-weight: 700;
  cursor: pointer;
  background: ${({ $primary }) =>
    $primary ? "linear-gradient(135deg, #2ea3ff, #6dd3ff)" : "transparent"};
  color: ${({ $primary }) => ($primary ? "#0c1021" : "var(--tg-text)")};
`;

export const Loader = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--tg-text-secondary);
`;

export const Error = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--tg-text-secondary);
`;

