import { useCallback, useRef, useState, type ReactNode } from "react";
import { NavBar } from "./NavBar";

type PageShellProps = {
  children: ReactNode;
  scroll?: boolean;
  padding?: boolean;
  withNav?: boolean;
  pullToRefresh?: boolean;
  onRefresh?: () => Promise<void> | void;
  className?: string;
};

export function PageShell({
  children,
  scroll = true,
  padding = true,
  withNav = true,
  pullToRefresh = true,
  onRefresh,
  className,
}: PageShellProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const maxPull = 90;
  const threshold = 60;

  const isTextInput = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    if (node instanceof HTMLInputElement) return true;
    if (node instanceof HTMLTextAreaElement) return true;
    if ((node as HTMLElement).isContentEditable) return true;
    return false;
  };

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!pullToRefresh || refreshing) return;
      if (isTextInput(event.target)) return;
      const container = contentRef.current;
      if (!container || container.scrollTop > 0) return;
      startYRef.current = event.touches[0]?.clientY ?? 0;
      pullingRef.current = true;
    },
    [pullToRefresh, refreshing]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!pullToRefresh || refreshing || !pullingRef.current) return;
      const container = contentRef.current;
      if (!container || container.scrollTop > 0) {
        pullingRef.current = false;
        setPullDistance(0);
        return;
      }
      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = currentY - startYRef.current;
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }
      const nextDistance = Math.min(delta * 0.55, maxPull);
      setPullDistance(nextDistance);
    },
    [pullToRefresh, refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pullToRefresh || !pullingRef.current) return;
    pullingRef.current = false;
    if (pullDistance < threshold) {
      setPullDistance(0);
      return;
    }
    setRefreshing(true);
    try {
      await Promise.resolve(onRefresh?.() ?? window.location.reload());
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh, pullToRefresh]);

  const contentClasses = [
    "page-shell__content",
    scroll ? "page-shell__content--scroll" : "page-shell__content--no-scroll",
    padding ? "page-shell__content--pad" : "page-shell__content--no-pad",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["page-shell", className].filter(Boolean).join(" ")}>
      <div
        className={contentClasses}
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ position: "relative" }}
      >
        {pullToRefresh ? (
          <>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                color: "var(--tg-text-secondary)",
                fontSize: 13,
                transform: `translateY(${Math.min(pullDistance, maxPull) - 40}px)`,
                transition: refreshing ? "transform 160ms ease" : "none",
              }}
            >
              {refreshing
                ? "Обновляю..."
                : pullDistance > threshold
                ? "Отпустите, чтобы обновить"
                : "Потяните для обновления"}
            </div>
            <div
              style={{
                transform: `translateY(${pullDistance}px)`,
                transition:
                  refreshing || pullDistance === 0
                    ? "transform 160ms ease"
                    : "none",
              }}
            >
              {children}
            </div>
          </>
        ) : (
          children
        )}
      </div>
      {withNav && <NavBar />}
    </div>
  );
}
