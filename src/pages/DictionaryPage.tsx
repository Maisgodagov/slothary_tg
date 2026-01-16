import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import {
  addWord,
  fetchDictionary,
  removeWord,
  selectDictionary,
} from "../features/dictionary/slice";
import { muellerApi, type MuellerEntry } from "../features/mueller/api";
import {
  type PhraseSnippet,
  videoDictionaryApi,
} from "../features/video-dictionary/api";
import { WordCard } from "../features/dictionary/components/WordCard";
import { Loader } from "../shared/ui/Loader";
import { Icon } from "../shared/ui/Icon";
import { PageShell } from "../shared/ui/PageShell";

const PAGE_SIZE = 6;
const CARD_GAP = 20;
const STORAGE_KEY = "videoDictionaryState";
const HISTORY_KEY = "dictionarySearchHistory";
const HISTORY_LIMIT = 5;

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
  const pattern = parts.map((part) => `\\b${part}\\b`).join("\\s+");
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

const snippetKey = (snippet: PhraseSnippet) => {
  if (snippet.id) return snippet.id;
  return `${snippet.contentId}-${snippet.startSeconds}-${snippet.endSeconds}-${snippet.matchedText}`;
};

const dedupeSnippets = (list: PhraseSnippet[]) => {
  const seen = new Set<string>();
  return list.filter((snippet) => {
    const key = snippetKey(snippet);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const mergeSnippets = (base: PhraseSnippet[], next: PhraseSnippet[]) => {
  const seen = new Set(base.map((snippet) => snippetKey(snippet)));
  const merged = [...base];
  next.forEach((snippet) => {
    const key = snippetKey(snippet);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(snippet);
  });
  return merged;
};

const detectLanguage = (value: string) => /[а-яё]/i.test(value);

const filterPureTranslations = (list: string[]) =>
  list.filter((value) => !/[a-z]/i.test(value));

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
  }, [
    isActive,
    isReady,
    shouldRender,
    snippet.endSeconds,
    snippet.startSeconds,
  ]);

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
        className="page-header"
        style={{
          width: "clamp(220px, 72vw, 360px)",
          height: "clamp(260px, 52vh, 420px)",
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
        height: "clamp(260px, 52vh, 420px)",
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

function SnippetCarousel({
  items,
  highlight,
  onOpenFullVideo,
  total,
}: {
  items: PhraseSnippet[];
  highlight: string;
  onOpenFullVideo: (snippet: PhraseSnippet) => void;
  total?: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardWidthRef = useRef(0);
  const scrollRaf = useRef<number | null>(null);

  const updateCardWidth = useCallback(() => {
    const first = cardRefs.current[0];
    if (!first) return;
    const width = first.getBoundingClientRect().width;
    cardWidthRef.current = width;
    sliderRef.current?.style.setProperty("--card-width", `${width}px`);
  }, []);

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

  useEffect(() => {
    updateCardWidth();
    const first = cardRefs.current[0];
    if (!first) return;
    const observer = new ResizeObserver(() => updateCardWidth());
    observer.observe(first);
    return () => observer.disconnect();
  }, [items.length, updateCardWidth]);

  useEffect(() => {
    const node = sliderRef.current;
    if (!node) return;
    const handleScroll = () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = requestAnimationFrame(() => {
        setActiveIndex(getCenteredIndex());
      });
    };
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [getCenteredIndex]);

  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) {
      setActiveIndex(items.length - 1);
    }
  }, [activeIndex, items.length]);

  return (
    <>
      <div
        ref={sliderRef}
        style={{
          display: "flex",
          gap: CARD_GAP,
          overflowX: "auto",
          paddingTop: 4,
          paddingBottom: 10,
          paddingLeft: "calc((100% - var(--card-width, 300px)) / 2)",
          paddingRight: "calc((100% - var(--card-width, 300px)) / 2)",
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
              key={snippetKey(snippet)}
              ref={(node) => {
                cardRefs.current[index] = node;
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
                onOpenFullVideo={onOpenFullVideo}
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
        {Math.min(activeIndex + 1, total ?? items.length)}/
        {total ?? items.length}
      </div>
    </>
  );
}

export default function DictionaryPage() {
  const auth = useAppSelector(selectAuth);
  const dictionary = useAppSelector(selectDictionary);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [dictEntries, setDictEntries] = useState<MuellerEntry[]>([]);
  const [dictStatus, setDictStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [dictError, setDictError] = useState<string | null>(null);
  const [videoQuery, setVideoQuery] = useState("");
  const showExamples = true;
  const [examplesOpen, setExamplesOpen] = useState(true);
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
  const [userExamplesOpenId, setUserExamplesOpenId] = useState<string | null>(
    null
  );
  const [userExpandedTranslationsId, setUserExpandedTranslationsId] = useState<
    string | null
  >(null);
  const [userExampleState, setUserExampleState] = useState<
    Record<
      string,
      {
        status: "idle" | "loading" | "ready" | "error";
        items: PhraseSnippet[];
        total?: number;
        error?: string;
      }
    >
  >({});
  const [userDictionaryDetails, setUserDictionaryDetails] = useState<
    Record<
      string,
      {
        status: "idle" | "loading" | "ready" | "error";
        translationsRu: string[];
        synonyms: string[];
        error?: string;
      }
    >
  >({});
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    word: string;
    translation: string;
  } | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

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
        videoQuery?: string;
        dictEntries?: MuellerEntry[];
        items?: PhraseSnippet[];
        total?: number;
        nextCursor?: string | null;
        hasMore?: boolean;
        activeIndex?: number;
        hasSearched?: boolean;
        examplesOpen?: boolean;
      };
      if (saved.query) setQuery(saved.query);
      if (saved.videoQuery) setVideoQuery(saved.videoQuery);
      if (saved.dictEntries && Array.isArray(saved.dictEntries)) {
        setDictEntries(saved.dictEntries);
        setDictStatus(saved.dictEntries.length ? "ready" : "idle");
      }
      if (saved.items && Array.isArray(saved.items)) {
        setItems(saved.items);
        setStatus(saved.items.length ? "ready" : "idle");
      }
      if (typeof saved.total === "number") setTotal(saved.total);
      setNextCursor(saved.nextCursor ?? null);
      setHasMore(Boolean(saved.hasMore));
      setActiveIndex(saved.activeIndex ?? 0);
      setHasSearched(Boolean(saved.hasSearched));
      if (typeof saved.examplesOpen === "boolean") {
        setExamplesOpen(saved.examplesOpen);
      }
      if (saved.query) setHighlight(saved.query);
    } catch {
      // ignore restore errors
    }
  }, []);

  useEffect(() => {
    try {
      const rawHistory = localStorage.getItem(HISTORY_KEY);
      if (!rawHistory) return;
      const parsed = JSON.parse(rawHistory);
      if (Array.isArray(parsed)) {
        setSearchHistory(
          parsed.filter((value) => typeof value === "string")
        );
      }
    } catch {
      // ignore restore errors
    }
  }, []);

  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = auth.profile?.id ?? null;
    if (!userId) {
      lastUserIdRef.current = null;
      return;
    }
    if (lastUserIdRef.current === userId) return;
    lastUserIdRef.current = userId;
    dispatch(fetchDictionary());
  }, [auth.profile?.id, dispatch]);

  useEffect(() => {
    if (dictionary.items.length === 0) return;
    if (userExpandedTranslationsId) return;
    setUserExpandedTranslationsId(dictionary.items[0]?.id ?? null);
  }, [dictionary.items, userExpandedTranslationsId]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("nav-hidden");
    };
  }, []);

  useEffect(() => {
    try {
      const payload = {
        query,
        videoQuery,
        dictEntries,
        items,
        total,
        nextCursor,
        hasMore,
        activeIndex,
        hasSearched,
        examplesOpen,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore persist errors
    }
  }, [activeIndex, dictEntries, hasMore, hasSearched, items, nextCursor, query, total, videoQuery]);

  const updateCardWidth = useCallback(() => {
    if (!firstCardRef.current) return;
    const width = firstCardRef.current.getBoundingClientRect().width;
    cardWidthRef.current = width;
    sliderRef.current?.style.setProperty("--card-width", `${width}px`);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setVideoQuery("");
    setDictEntries([]);
    setDictStatus("idle");
    setDictError(null);
    setExamplesOpen(true);
    setItems([]);
    setHighlight("");
    setHasMore(false);
    setNextCursor(null);
    setTotal(0);
    setStatus("idle");
    setError(null);
    setHasSearched(false);
    setActiveIndex(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleSearch = useCallback(async (value?: string) => {
    const trimmed = (value ?? query).trim();
    if (!trimmed) return;

    setHistoryOpen(false);
    setSearchHistory((prev) => {
      const next = [
        trimmed,
        ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, HISTORY_LIMIT);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);
    setDictStatus("loading");
    setDictError(null);
    setHasSearched(true);
    setItems([]);
    setHasMore(false);
    setNextCursor(null);
    setTotal(0);
    setActiveIndex(0);
    setHighlight(trimmed);

    try {
      const isRu = detectLanguage(trimmed);
      const dictionaryResults = await muellerApi.lookup({
        word: trimmed,
        lang: isRu ? "ru" : "en",
      });

      setDictEntries(dictionaryResults);
      setDictStatus("ready");

      const nextVideoQuery = isRu ? dictionaryResults[0]?.word?.trim() ?? "" : trimmed;
      setVideoQuery(nextVideoQuery);
      setHighlight(nextVideoQuery || trimmed);

      if (!nextVideoQuery) {
        setItems([]);
        setHasMore(false);
        setNextCursor(null);
        setTotal(0);
        setStatus("ready");
        return;
      }

      const response = await videoDictionaryApi.searchPhrase({
        phrase: nextVideoQuery,
        limit: PAGE_SIZE,
        cursor: null,
        paddingSeconds: computePaddingSeconds(nextVideoQuery),
        userId: auth.profile?.id ?? null,
        signal: controller.signal,
      });

      const deduped = dedupeSnippets(response.items);
      const nextHasMore = response.hasMore && deduped.length > 0;
      setItems(deduped);
      setHasMore(nextHasMore);
      setNextCursor(nextHasMore ? response.nextCursor : null);
      setTotal(nextHasMore ? response.total : deduped.length);
      setStatus("ready");
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      const message = err?.message ?? "Не удалось выполнить поиск";
      setError(message);
      setDictError(message);
      setStatus("error");
      setDictStatus("error");
    }
  }, [auth.profile?.id, query]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const response = await videoDictionaryApi.searchPhrase({
        phrase: videoQuery.trim(),
        limit: PAGE_SIZE,
        cursor: nextCursor,
        paddingSeconds: computePaddingSeconds(videoQuery),
        userId: auth.profile?.id ?? null,
      });

      setItems((prev) => {
        const merged = mergeSnippets(prev, response.items);
        const added = merged.length - prev.length;
        const nextHasMore = response.hasMore && added > 0;
        setHasMore(nextHasMore);
        setNextCursor(nextHasMore ? response.nextCursor : null);
        setTotal(nextHasMore ? response.total : merged.length);
        return merged;
      });
    } catch (err: any) {
      setError(err?.message ?? "Не удалось загрузить еще результаты");
    } finally {
      setIsLoadingMore(false);
    }
  }, [auth.profile?.id, hasMore, isLoadingMore, nextCursor, videoQuery]);

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
    card.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, []);

  useEffect(() => {
    if (!examplesOpen || !firstCardRef.current) return;
    updateCardWidth();
    const observer = new ResizeObserver(() => updateCardWidth());
    observer.observe(firstCardRef.current);
    return () => observer.disconnect();
  }, [examplesOpen, items.length, updateCardWidth]);

  useEffect(() => {
    if (!examplesOpen || !sliderRef.current || items.length === 0) return;
    requestAnimationFrame(() => {
      updateCardWidth();
      snapToIndex(Math.min(activeIndex, items.length - 1));
    });
  }, [examplesOpen, activeIndex, items.length, snapToIndex, updateCardWidth]);

  useEffect(() => {
    if (!examplesOpen || !sliderRef.current || cardWidthRef.current === 0) return;

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
  }, [examplesOpen, getCenteredIndex, items.length, snapToIndex]);

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
    if (status === "loading" || dictStatus === "loading") return null;
    if (!hasSearched) return null;
    if (status === "error") return error ?? "Произошла ошибка";
    if (dictStatus === "error") return dictError ?? "Произошла ошибка";
    if (dictStatus === "ready" && dictEntries.length === 0) {
      return "Перевод не найден. Попробуйте другой запрос.";
    }
    if (status === "ready" && items.length === 0 && dictEntries.length === 0)
      return "Ничего не найдено. Попробуйте другой запрос.";
    return null;
  }, [
    dictEntries.length,
    dictError,
    dictStatus,
    error,
    hasSearched,
    items.length,
    status,
  ]);

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

  const loadUserExamples = useCallback(
    async (entryId: string, phrase: string) => {
      if (!auth.profile?.id) return;
      setUserExampleState((prev) => ({
        ...prev,
        [entryId]: { status: "loading", items: [] },
      }));

      try {
        const response = await videoDictionaryApi.searchPhrase({
          phrase,
          limit: PAGE_SIZE,
          cursor: null,
          paddingSeconds: computePaddingSeconds(phrase),
          userId: auth.profile.id,
        });
        const items = dedupeSnippets(response.items);
        setUserExampleState((prev) => ({
          ...prev,
          [entryId]: { status: "ready", items, total: response.total },
        }));
      } catch (err: any) {
        setUserExampleState((prev) => ({
          ...prev,
          [entryId]: {
            status: "error",
            items: [],
            total: 0,
            error: err?.message ?? "Не удалось загрузить примеры.",
          },
        }));
      }
    },
    [auth.profile?.id]
  );

  const loadUserDictionaryDetails = useCallback(
    async (entryId: string, word: string) => {
      setUserDictionaryDetails((prev) => ({
        ...prev,
        [entryId]: { status: "loading", translationsRu: [], synonyms: [] },
      }));

      try {
        const lang = detectLanguage(word) ? "ru" : "en";
        const entries = await muellerApi.lookup({ word, lang });
        const primary = entries[0];
        const translationsRu = filterPureTranslations(
          primary?.translations ?? []
        ).slice(0, 6);
        const synonyms = (primary?.synonyms ?? [])
          .filter((value) => value && /[a-z]/i.test(value))
          .slice(0, 6);
        setUserDictionaryDetails((prev) => ({
          ...prev,
          [entryId]: {
            status: "ready",
            translationsRu,
            synonyms,
          },
        }));
      } catch (err: any) {
        setUserDictionaryDetails((prev) => ({
          ...prev,
          [entryId]: {
            status: "error",
            translationsRu: [],
            synonyms: [],
            error: err?.message ?? "Не удалось загрузить переводы.",
          },
        }));
      }
    },
    []
  );

  const toggleUserExamples = useCallback(
    (entryId: string, phrase: string) => {
      setExamplesOpen(false);
      setUserExamplesOpenId((prev) => {
        const nextValue = prev === entryId ? null : entryId;
        if (nextValue && userExampleState[entryId]?.status !== "ready") {
          loadUserExamples(entryId, phrase);
        }
        return nextValue;
      });
    },
    [loadUserExamples, userExampleState]
  );

  const toggleUserTranslations = useCallback((entryId: string) => {
    setUserExpandedTranslationsId((prev) => {
      const nextValue = prev === entryId ? null : entryId;
      if (nextValue && userDictionaryDetails[nextValue]?.status !== "ready") {
        const entry = dictionary.items.find((item) => item.id === nextValue);
        if (entry) loadUserDictionaryDetails(entry.id, entry.word);
      }
      return nextValue;
    });
    setUserExamplesOpenId(null);
  }, [dictionary.items, loadUserDictionaryDetails, userDictionaryDetails]);

  return (
    <PageShell>
      <div
        style={{
          display: "grid",
          gap: 16,
          alignContent: "start",
          justifyItems: "stretch",
          paddingRight: 12,
          paddingLeft: 12,
          paddingBottom: 60,
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
            <div style={{ position: "relative" }}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Введите слово или фразу"
                style={{
                  width: "100%",
                  borderRadius: 12,
                  borderBottomLeftRadius: historyOpen ? 0 : 12,
                  borderBottomRightRadius: historyOpen ? 0 : 12,
                  border: "1px solid var(--tg-border)",
                  borderBottom: historyOpen ? "none" : "1px solid var(--tg-border)",
                  height: 44,
                  padding: "0 36px 0 12px",
                  background: "var(--tg-card)",
                  color: "var(--tg-text)",
                  fontSize: 14,
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                onFocus={() => {
                  if (searchHistory.length > 0) setHistoryOpen(true);
                  document.documentElement.classList.add("nav-hidden");
                }}
                onBlur={() => {
                  setHistoryOpen(false);
                  document.documentElement.classList.remove("nav-hidden");
                }}
              />
              {query.trim().length > 0 && (
                <button
                  onClick={handleClear}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: "var(--tg-subtle)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
                aria-label="Очистить"
              >
                <Icon name="close" size={16} />
                </button>
              )}
              {historyOpen && searchHistory.length > 0 && (
                <div
                  onMouseDown={(event) => event.preventDefault()}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "var(--tg-surface)",
                    border: "1px solid var(--tg-border)",
                    borderTop: "none",
                    borderRadius: 12,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    zIndex: 20,
                    display: "grid",
                    gap: 4,
                    padding: 8,
                  }}
                >
                  {searchHistory.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setQuery(item);
                        handleSearch(item);
                      }}
                      style={{
                        textAlign: "left",
                        border: "none",
                        background: "transparent",
                        color: "var(--tg-text)",
                        padding: "6px 8px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        opacity: 0.75,
                      }}
                    >
                      <Icon name="history" size={14} color="var(--tg-subtle)" />
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleSearch()}
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

        {(status === "loading" || dictStatus === "loading") && (
          <div style={{ display: "grid", placeItems: "center" }}>
            <Loader />
          </div>
        )}

        {dictStatus === "ready" && dictEntries.length > 0 &&
          (() => {
            const isRuQuery = detectLanguage(highlight);
            const primaryEntry = dictEntries[0];
            const ruTranslationsAll = filterPureTranslations(
              primaryEntry?.translations ?? []
            );
            const primaryEnglish = primaryEntry?.word?.trim() || query.trim();
            const primaryRussian = isRuQuery
              ? highlight.trim()
              : ruTranslationsAll[0] ?? "";
            const otherTranslationsRu = ruTranslationsAll
              .filter((value) => value && value !== primaryRussian)
              .slice(0, 4);
            const synonymsAll = (primaryEntry?.synonyms ?? []).filter(
              (value) => value && /[a-z]/i.test(value)
            );
            const synonyms = synonymsAll
              .filter((value) => value !== primaryEnglish)
              .slice(0, 4);
            const hasSnippets = items.length > 0;
            const showSnippets = showExamples && examplesOpen && hasSnippets;
            const normalizedWord = primaryEnglish.toLowerCase();
            const normalizedTranslation = primaryRussian.trim().toLowerCase();
            const existingEntry = dictionary.items.find(
              (entry) =>
                entry.word.toLowerCase() === normalizedWord &&
                entry.translation.toLowerCase() === normalizedTranslation
            );
            const isInDictionary = Boolean(existingEntry);
            const dictionaryActionLabel = isInDictionary
              ? "В словаре"
              : "+ В словарь";

            return (
              <WordCard
                word={primaryEnglish}
                translation={primaryRussian}
                otherTranslationsRu={otherTranslationsRu}
                synonyms={synonyms}
                onSynonymClick={(value) => {
                  setQuery(value);
                  handleSearch(value);
                }}
                showExamplesButton={showExamples && hasSnippets}
                examplesOpen={examplesOpen}
                onToggleExamples={() =>
                  setExamplesOpen((prev) => {
                    const nextValue = !prev;
                    if (nextValue) setUserExamplesOpenId(null);
                    return nextValue;
                  })
                }
                dictionaryActionLabel={dictionaryActionLabel}
                dictionaryActionMode={isInDictionary ? "tag" : "button"}
                dictionaryActionDisabled={isInDictionary}
                onDictionaryAction={() => {
                  if (!auth.profile?.id) return;
                  if (isInDictionary && existingEntry) {
                    dispatch(removeWord(existingEntry.id));
                    return;
                  }
                  const lang = isRuQuery ? "ru" : "en";
                  const queryValue = highlight.trim();
                  if (!queryValue) return;
                  dispatch(
                    addWord({
                      query: queryValue,
                      lang,
                      word: primaryEnglish,
                      translation: primaryRussian,
                    })
                  );
                }}
              >
                {showSnippets && (
                  <>
                    <div
                      ref={sliderRef}
                      className="video-dict-slider"
                      style={{
                        display: "flex",
                        gap: CARD_GAP,
                        overflowX: "auto",
                        overflowY: "hidden",
                        paddingTop: 4,
                        paddingBottom: 10,
                        paddingLeft:
                          "calc((100% - var(--card-width, 320px)) / 2)",
                        paddingRight:
                          "calc((100% - var(--card-width, 320px)) / 2)",
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
                              transition:
                                "opacity 0.2s ease, transform 0.2s ease",
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
                        {(() => {
                        const displayTotal = total > 0 ? total : items.length;
                        const displayIndex = Math.min(
                          activeIndex + 1,
                          displayTotal
                        );
                        return `${displayIndex}/${displayTotal}`;
                      })()}
                    </div>
                  </>
                )}
              </WordCard>
            );
          })()}

        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--tg-text)",
              paddingLeft: 4,
            }}
          >
            Мой словарь
          </div>
          {dictionary.items.length === 0 && (
            <div
              style={{
                color: "var(--tg-subtle)",
                fontSize: 13,
                paddingLeft: 4,
              }}
            >
              Здесь пока пусто. Добавляйте новые слова в словарь, и они будут
              появляться в этом списке.
            </div>
          )}
          {dictionary.items.map((entry) => {
            const open = userExamplesOpenId === entry.id;
            const state = userExampleState[entry.id] ?? {
              status: "idle",
              items: [],
            };
            const expanded = userExpandedTranslationsId === entry.id;
            const otherTranslations = expanded
              ? entry.otherTranslations
              : undefined;
            const hasRuTranslations =
              expanded &&
              Boolean(otherTranslations?.some((value) => detectLanguage(value)));
            const otherTranslationsRu = hasRuTranslations
              ? otherTranslations
              : undefined;
            const synonyms = expanded && !hasRuTranslations
              ? otherTranslations
              : undefined;
            const details = userDictionaryDetails[entry.id];
            const detailsTranslations =
              expanded && details?.status === "ready"
                ? details.translationsRu
                : undefined;
            const detailsSynonyms =
              expanded && details?.status === "ready"
                ? details.synonyms
                : undefined;

            return (
              <div key={entry.id} style={{ position: "relative" }}>
                {expanded && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteTarget({
                        id: entry.id,
                        word: entry.word,
                        translation: entry.translation,
                      });
                    }}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: "none",
                      background: "transparent",
                      color: "var(--tg-subtle)",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      zIndex: 2,
                    }}
                    aria-label="Удалить"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}

                <div
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("button")) return;
                    toggleUserTranslations(entry.id);
                  }}
                >
                    <WordCard
                      word={entry.word}
                      translation={entry.translation}
                      otherTranslationsRu={
                        detailsTranslations ?? otherTranslationsRu
                      }
                      synonyms={detailsSynonyms ?? synonyms}
                      showExamplesButton={expanded}
                      examplesOpen={open}
                      onToggleExamples={() =>
                        toggleUserExamples(entry.id, entry.word)
                    }
                    dictionaryActionMode="none"
                    variant="compact"
                  >
                    {expanded && open && (
                      <>
                        {state.status === "loading" && (
                          <div style={{ display: "grid", placeItems: "center" }}>
                            <Loader />
                          </div>
                        )}
                        {state.status === "error" && (
                          <div style={{ color: "var(--tg-danger)", fontSize: 13 }}>
                            {state.error}
                          </div>
                        )}
                        {state.status === "ready" && state.items.length === 0 && (
                          <div style={{ color: "var(--tg-subtle)", fontSize: 13 }}>
                            Примеры не найдены.
                          </div>
                        )}
                        {state.items.length > 0 && (
                            <SnippetCarousel
                              items={state.items}
                              highlight={entry.word}
                              onOpenFullVideo={handleOpenFullVideo}
                              total={state.total}
                            />
                          )}
                      </>
                    )}
                  </WordCard>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(360px, 92vw)",
              background: "var(--tg-surface)",
              border: "1px solid var(--tg-border)",
              borderRadius: 16,
              padding: 16,
              display: "grid",
              gap: 12,
              color: "var(--tg-text)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Удалить слово?
            </div>
            <div style={{ color: "var(--tg-subtle)", fontSize: 13 }}>
              {deleteTarget.word} - {deleteTarget.translation}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  border: "1px solid var(--tg-border)",
                  background: "var(--tg-card)",
                  color: "var(--tg-text)",
                  fontWeight: 600,
                  borderRadius: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch(removeWord(deleteTarget.id));
                  setDeleteTarget(null);
                }}
                style={{
                  border: "none",
                  background: "var(--tg-danger)",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
