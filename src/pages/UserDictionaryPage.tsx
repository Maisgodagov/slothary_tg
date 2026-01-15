import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import {
  fetchDictionary,
  removeWord,
  selectDictionary,
} from "../features/dictionary/slice";
import {
  type PhraseSnippet,
  videoDictionaryApi,
} from "../features/video-dictionary/api";
import { WordCard } from "../features/dictionary/components/WordCard";
import { Loader } from "../shared/ui/Loader";
import { PageShell } from "../shared/ui/PageShell";

const PAGE_SIZE = 8;
const CARD_GAP = 14;

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
      if (
        video.currentTime < snippet.startSeconds ||
        video.currentTime > snippet.endSeconds
      ) {
        video.currentTime = snippet.startSeconds;
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
          width: "clamp(210px, 66vw, 320px)",
          height: "clamp(240px, 46vh, 360px)",
          borderRadius: 18,
          background: "var(--tg-card)",
          border: "1px solid var(--tg-border)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "clamp(210px, 66vw, 320px)",
        height: "clamp(240px, 46vh, 360px)",
        borderRadius: 18,
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
            left: 10,
            right: 10,
            bottom: 12,
            display: "grid",
            justifyItems: "center",
            textAlign: "center",
            color: "#fff",
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.78)",
              padding: "6px 10px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {buildHighlightedText(snippet.contextText, highlight)}
          </div>
        </div>
      )}
      {!isPlaying && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.45)",
              display: "grid",
              placeItems: "center",
              fontSize: 22,
              color: "#fff",
            }}
          >
            ▶
          </span>
        </div>
      )}
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
}: {
  items: PhraseSnippet[];
  highlight: string;
  onOpenFullVideo: (snippet: PhraseSnippet) => void;
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
        {Math.min(activeIndex + 1, items.length)}/{items.length}
      </div>
    </>
  );
}

export default function UserDictionaryPage() {
  const auth = useAppSelector(selectAuth);
  const dictionary = useAppSelector(selectDictionary);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [examplesOpen, setExamplesOpen] = useState<Record<string, boolean>>({});
  const [expandedTranslations, setExpandedTranslations] = useState<
    Record<string, boolean>
  >({});
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    word: string;
    translation: string;
  } | null>(null);
  const [exampleState, setExampleState] = useState<
    Record<
      string,
      {
        status: "idle" | "loading" | "ready" | "error";
        items: PhraseSnippet[];
        error?: string;
      }
    >
  >({});
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

  const loadExamples = useCallback(
    async (entryId: string, phrase: string) => {
      if (!auth.profile?.id) return;
      setExampleState((prev) => ({
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
        setExampleState((prev) => ({
          ...prev,
          [entryId]: { status: "ready", items },
        }));
      } catch (err: any) {
        setExampleState((prev) => ({
          ...prev,
          [entryId]: {
            status: "error",
            items: [],
            error: err?.message ?? "Не удалось загрузить примеры.",
          },
        }));
      }
    },
    [auth.profile?.id]
  );

  const toggleExamples = useCallback(
    (entryId: string, phrase: string) => {
      setExamplesOpen((prev) => {
        const nextValue = !prev[entryId];
        if (nextValue && exampleState[entryId]?.status !== "ready") {
          loadExamples(entryId, phrase);
        }
        return { ...prev, [entryId]: nextValue };
      });
    },
    [exampleState, loadExamples]
  );

  const toggleTranslations = useCallback((entryId: string) => {
    setExpandedTranslations((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  }, []);

  if (!auth.profile) {
    return (
      <PageShell>
        <div
          style={{
            padding: "0 16px",
            color: "var(--tg-subtle)",
            textAlign: "center",
          }}
        >
          Войдите, чтобы открыть словарь.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div
        style={{
          display: "grid",
          gap: 16,
          alignContent: "start",
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        {dictionary.status === "loading" && (
          <div style={{ display: "grid", placeItems: "center" }}>
            <Loader />
          </div>
        )}

        {dictionary.items.map((entry) => {
          const open = examplesOpen[entry.id] ?? false;
          const state = exampleState[entry.id] ?? {
            status: "idle",
            items: [],
          };
          const translationsOpen = expandedTranslations[entry.id] ?? false;
          const otherTranslations = translationsOpen
            ? entry.otherTranslations
            : undefined;

          return (
            <div
              key={entry.id}
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 16,
              }}
            >
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
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "1px solid var(--tg-border)",
                  background: "var(--tg-card)",
                  color: "var(--tg-text)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  zIndex: 2,
                }}
                aria-label="Удалить"
              >
                ✕
              </button>
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                }}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("button")) return;
                  toggleTranslations(entry.id);
                }}
              >
                <WordCard
                  word={entry.word}
                  translation={entry.translation}
                  otherTranslations={otherTranslations}
                  showExamplesButton={true}
                  examplesOpen={open}
                  onToggleExamples={() => toggleExamples(entry.id, entry.word)}
                  dictionaryActionMode="none"
                  variant="compact"
                >
                  {open && (
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
