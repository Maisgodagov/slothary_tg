import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import {
  type PhraseSnippet,
  videoDictionaryApi,
} from "../features/video-dictionary/api";
import { Loader } from "../shared/ui/Loader";
import { Icon } from "../shared/ui/Icon";

const PAGE_SIZE = 6;
const CARD_GAP = 16;
const STORAGE_KEY = "videoDictionaryState";

const computePaddingSeconds = (phrase: string): number => {
  const trimmed = phrase.trim();
  if (!trimmed) return 2;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 2) return 2;
  if (wordCount <= 4) return 2;
  return 1;
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createHighlightRegex = (value: string): RegExp | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/\s+/).map(escapeRegExp);
  const pattern = parts.join("\\s+");
  return new RegExp(pattern, "gi");
};

const buildHighlightedText = (text: string, highlight: string): ReactNode => {
  const regex = createHighlightRegex(highlight);
  if (!regex) return text;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <span
        key={`hl-${key++}`}
        style={{
          color: "#ffd54a",
          fontWeight: 700,
        }}
      >
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : text;
};

function SnippetCard({
  snippet,
  isActive,
  shouldRender,
  highlight,
  onOpenFullVideo,
}: {
  snippet: PhraseSnippet;
  isActive: boolean;
  shouldRender: boolean;
  highlight: string;
  onOpenFullVideo: (snippet: PhraseSnippet) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!shouldRender) {
      setIsPlaying(false);
      setIsReady(false);
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    if (!isActive) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    if (isReady) {
      const safeStart = snippet.startSeconds;
      const safeEnd = snippet.endSeconds;
      if (video.currentTime < safeStart || video.currentTime > safeEnd) {
        video.currentTime = safeStart;
      }
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isActive, isReady, shouldRender, snippet.endSeconds, snippet.startSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isActive) {
      video.pause();
      setIsPlaying(false);
      return;
    }
  }, [isActive]);

  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      if (Math.abs(video.currentTime - snippet.startSeconds) > 0.4) {
        video.currentTime = snippet.startSeconds;
      }
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [snippet.startSeconds]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isActive) {
      video.pause();
      setIsPlaying(false);
      return;
    }
    if (video.currentTime >= snippet.endSeconds) {
      video.currentTime = snippet.startSeconds;
      if (isActive) {
        video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    }
  }, [isActive, snippet.endSeconds, snippet.startSeconds]);

  if (!shouldRender) {
    return (
      <div
        style={{
          width: "clamp(220px, 72vw, 360px)",
          height: "clamp(340px, 64vh, 520px)",
          borderRadius: 22,
          background: "var(--tg-card)",
          border: "1px solid var(--tg-border)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "clamp(220px, 72vw, 360px)",
        height: "clamp(340px, 64vh, 520px)",
        borderRadius: 22,
        overflow: "hidden",
        background: "#000",
        position: "relative",
        scrollSnapAlign: "center",
        border: "1px solid var(--tg-border)",
      }}
    >
      <button
        onClick={(event) => {
          event.stopPropagation();
          onOpenFullVideo(snippet);
        }}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 2,
          borderRadius: 999,
          border: "none",
          padding: "6px 10px",
          background: "rgba(0,0,0,0.65)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Полное видео
      </button>
      <video
        ref={videoRef}
        src={snippet.videoUrl}
        playsInline
        preload="metadata"
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (!video) return;
          video.currentTime = snippet.startSeconds;
          setIsReady(true);
          if (isActive) {
            video.play().catch(() => undefined);
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {snippet.contextText && (
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 16,
            display: "grid",
            justifyItems: "center",
            textAlign: "center",
            color: "#fff",
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.78)",
              padding: "8px 12px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {buildHighlightedText(snippet.contextText, highlight)}
          </div>
        </div>
      )}
      <button
        onClick={handleTogglePlay}
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background: "transparent",
          border: "none",
          color: "#fff",
          cursor: "pointer",
        }}
        aria-label={isPlaying ? "Пауза" : "Проиграть"}
      >
        {!isPlaying && (
          <span
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.45)",
              display: "grid",
              placeItems: "center",
              fontSize: 26,
            }}
          >
            ▶
          </span>
        )}
      </button>
      {!isReady && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <Loader />
        </div>
      )}
    </div>
  );
}

export default function DictionaryPage() {
  const auth = useAppSelector(selectAuth);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PhraseSnippet[]>([]);
  const [highlight, setHighlight] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const firstCardRef = useRef<HTMLDivElement | null>(null);
  const cardWidthRef = useRef(0);
  const scrollRaf = useRef<number | null>(null);
  const scrollEndTimer = useRef<number | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lastSettledIndex = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        query?: string;
        items?: PhraseSnippet[];
        total?: number;
        nextCursor?: string | null;
        hasMore?: boolean;
        activeIndex?: number;
        hasSearched?: boolean;
      };
      if (saved.query) setQuery(saved.query);
      if (saved.items && Array.isArray(saved.items)) {
        setItems(saved.items);
        setStatus(saved.items.length ? "ready" : "idle");
      }
      if (typeof saved.total === "number") setTotal(saved.total);
      setNextCursor(saved.nextCursor ?? null);
      setHasMore(Boolean(saved.hasMore));
      setActiveIndex(saved.activeIndex ?? 0);
      setHasSearched(Boolean(saved.hasSearched));
      if (saved.query) setHighlight(saved.query);
    } catch {
      // ignore restore errors
    }
  }, []);

  useEffect(() => {
    try {
      const payload = {
        query,
        items,
        total,
        nextCursor,
        hasMore,
        activeIndex,
        hasSearched,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore persist errors
    }
  }, [activeIndex, hasMore, hasSearched, items, nextCursor, query, total]);

  const updateCardWidth = useCallback(() => {
    if (!firstCardRef.current) return;
    const width = firstCardRef.current.getBoundingClientRect().width;
    cardWidthRef.current = width;
    sliderRef.current?.style.setProperty("--card-width", `${width}px`);
  }, []);

  useEffect(() => {
    if (!firstCardRef.current) return;
    updateCardWidth();
    const observer = new ResizeObserver(() => updateCardWidth());
    observer.observe(firstCardRef.current);
    return () => observer.disconnect();
  }, [items.length, updateCardWidth]);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);
    setHasSearched(true);
    setItems([]);
    setHasMore(false);
    setNextCursor(null);
    setTotal(0);
    setActiveIndex(0);
    setHighlight(trimmed);

    try {
      const response = await videoDictionaryApi.searchPhrase({
        phrase: trimmed,
        limit: PAGE_SIZE,
        cursor: null,
        paddingSeconds: computePaddingSeconds(trimmed),
        userId: auth.profile?.id ?? null,
        signal: controller.signal,
      });

      setItems(response.items);
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
      setTotal(response.total);
      setStatus("ready");
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setError(err?.message ?? "Не удалось выполнить поиск");
      setStatus("error");
    }
  }, [auth.profile?.id, query]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const response = await videoDictionaryApi.searchPhrase({
        phrase: query.trim(),
        limit: PAGE_SIZE,
        cursor: nextCursor,
        paddingSeconds: computePaddingSeconds(query),
        userId: auth.profile?.id ?? null,
      });

      setItems((prev) => [...prev, ...response.items]);
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
      setTotal(response.total);
    } catch (err: any) {
      setError(err?.message ?? "Не удалось загрузить еще результаты");
    } finally {
      setIsLoadingMore(false);
    }
  }, [auth.profile?.id, hasMore, isLoadingMore, nextCursor, query]);

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;
    if (activeIndex >= items.length - 2) {
      handleLoadMore();
    }
  }, [activeIndex, handleLoadMore, hasMore, isLoadingMore, items.length]);

  const getCenteredIndex = useCallback(() => {
    if (!sliderRef.current || items.length === 0) return 0;
    const containerRect = sliderRef.current.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((node, index) => {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(center - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }, [items.length]);

  const snapToIndex = useCallback((index: number) => {
    const card = cardRefs.current[index];
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  useEffect(() => {
    if (!sliderRef.current || cardWidthRef.current === 0) return;

    const handleScroll = () => {
      if (!sliderRef.current || cardWidthRef.current === 0) return;
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = requestAnimationFrame(() => {
        const centered = getCenteredIndex();
        setActiveIndex(centered);
      });

      if (scrollEndTimer.current) {
        window.clearTimeout(scrollEndTimer.current);
      }
      scrollEndTimer.current = window.setTimeout(() => {
        const centered = getCenteredIndex();
        const maxStep = 1;
        const clamped = Math.max(
          0,
          Math.min(
            items.length - 1,
            Math.max(
              lastSettledIndex.current - maxStep,
              Math.min(lastSettledIndex.current + maxStep, centered)
            )
          )
        );
        lastSettledIndex.current = clamped;
        setActiveIndex(clamped);
        snapToIndex(clamped);
      }, 180);
    };

    const node = sliderRef.current;
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [getCenteredIndex, items.length, snapToIndex]);

  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) {
      setActiveIndex(items.length - 1);
    }
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (items.length === 0) return;
    lastSettledIndex.current = Math.min(activeIndex, items.length - 1);
  }, [activeIndex, items.length]);

  const helperText = useMemo(() => {
    if (!hasSearched) return "Введите слово или фразу на английском.";
    if (status === "loading") return "Ищем совпадения в видео...";
    if (status === "error") return error ?? "Произошла ошибка";
    if (status === "ready" && items.length === 0)
      return "Ничего не найдено. Попробуйте другой запрос.";
    return null;
  }, [error, hasSearched, items.length, status]);

  const handleOpenFullVideo = useCallback(
    (snippet: PhraseSnippet) => {
      if (!snippet.contentId) return;
      navigate(
        `/video?contentId=${encodeURIComponent(
          snippet.contentId
        )}&focus=${Date.now()}`
      );
    },
    [navigate]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px 16px 40px",
        color: "var(--tg-text)",
        background: "var(--tg-bg)",
        display: "grid",
        gap: 16,
        alignContent: "start",
        justifyItems: "stretch",
      }}
    >
      <div
        style={{
          background: "var(--tg-surface)",
          border: "1px solid var(--tg-border)",
          borderRadius: 18,
          padding: 16,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Введите слово или фразу"
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid var(--tg-border)",
              padding: "10px 12px",
              background: "var(--tg-card)",
              color: "var(--tg-text)",
              fontSize: 14,
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
            }}
          />
          <button
            onClick={handleSearch}
            disabled={status === "loading"}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: "none",
              background: "var(--tg-accent-strong)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              opacity: status === "loading" ? 0.7 : 1,
            }}
            aria-label="Найти фрагменты"
          >
            <Icon name="search" size={20} color="#fff" />
          </button>
        </div>
      </div>

      {helperText && (
        <div
          style={{
            textAlign: "center",
            color: "var(--tg-subtle)",
            fontSize: 14,
          }}
        >
          {helperText}
        </div>
      )}

      {status === "loading" && (
        <div style={{ display: "grid", placeItems: "center" }}>
          <Loader />
        </div>
      )}

      {items.length > 0 && (
        <>
          <div
            ref={sliderRef}
            className="video-dict-slider"
            style={{
              display: "flex",
              gap: CARD_GAP,
              overflowX: "auto",
              paddingTop: 4,
              paddingBottom: 14,
              paddingLeft: "calc((100% - var(--card-width, 320px)) / 2)",
              paddingRight: "calc((100% - var(--card-width, 320px)) / 2)",
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {items.map((snippet, index) => {
              const isActive = index === activeIndex;
              const shouldRender = Math.abs(index - activeIndex) <= 1;

              return (
                <div
                  key={snippet.id}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                    if (index === 0) firstCardRef.current = node;
                  }}
                  style={{
                    flex: "0 0 auto",
                    scrollSnapStop: "always",
                    opacity: isActive ? 1 : 0.55,
                    transform: isActive ? "scale(1)" : "scale(0.92)",
                    transition: "opacity 0.2s ease, transform 0.2s ease",
                    transformOrigin: "center",
                  }}
                >
                  <SnippetCard
                    snippet={snippet}
                    isActive={isActive}
                    shouldRender={shouldRender}
                    highlight={highlight}
                    onOpenFullVideo={handleOpenFullVideo}
                  />
                </div>
              );
            })}
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "var(--tg-subtle)",
            }}
          >
            {Math.min(activeIndex + 1, total || items.length)}/
            {total || items.length}
          </div>
        </>
      )}
    </div>
  );
}
