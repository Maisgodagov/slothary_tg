import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import {
  type PhraseSnippet,
  videoDictionaryApi,
} from "../features/video-dictionary/api";
import { Range, getTrackBackground } from "react-range";
import { gameSnippetsApi, type GameSnippet } from "../features/game-snippets/api";
import { Icon } from "../shared/ui/Icon";
import { Loader } from "../shared/ui/Loader";
import { PageShell } from "../shared/ui/PageShell";

type PoolSnippet = PhraseSnippet & {
  startSeconds: number;
  endSeconds: number;
  translation: string | null;
};

const CARD_GAP = 20;

const TEXT = {
  adminOnly: "\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u0442\u043e\u043b\u044c\u043a\u043e \u0434\u043b\u044f \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430.",
  title: "\u041f\u0443\u043b \u043c\u0438\u043d\u0438-\u0438\u0433\u0440",
  inPool: "\u0412 \u043f\u0443\u043b\u0435:",
  searchLabel: "\u041f\u043e\u0438\u0441\u043a \u0444\u0440\u0430\u0437\u044b",
  searchPlaceholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0444\u0440\u0430\u0437\u0443",
  searching: "\u0418\u0449\u0435\u043c...",
  searchButton: "\u041d\u0430\u0439\u0442\u0438",
  results: "\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b",
  currentPool: "\u0422\u0435\u043a\u0443\u0449\u0438\u0439 \u043f\u0443\u043b",
  remove: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c",
  addToPool: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432 \u043f\u0443\u043b",
  edit: "\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c",
  save: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c",
  cancel: "\u041e\u0442\u043c\u0435\u043d\u0430",
  close: "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
  listen: "\u041f\u0440\u043e\u0441\u043b\u0443\u0448\u0430\u0442\u044c \u0444\u0440\u0430\u0433\u043c\u0435\u043d\u0442",
  pause: "\u041f\u0430\u0443\u0437\u0430",
  play: "\u041f\u0440\u043e\u0438\u0433\u0440\u0430\u0442\u044c",
  start: "\u041d\u0430\u0447\u0430\u043b\u043e",
  end: "\u041a\u043e\u043d\u0435\u0446",
  translationLabel: "\u041f\u0435\u0440\u0435\u0432\u043e\u0434",
  translationPlaceholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043f\u0435\u0440\u0435\u0432\u043e\u0434",
};

const adaptPoolSnippet = (item: GameSnippet): PoolSnippet => ({
  id: item.id,
  phrase: item.phrase,
  translation: item.translation ?? null,
  contentId: String(item.contentId),
  videoName: item.videoName ?? "",
  videoUrl: item.videoUrl ?? "",
  startSeconds: item.startSeconds,
  endSeconds: item.endSeconds,
  matchedText: "",
  contextText: "",
  durationSeconds: null,
});

const snippetKey = (snippet: PhraseSnippet) => {
  if (snippet.id) return snippet.id;
  return `${snippet.contentId}-${snippet.startSeconds}-${snippet.endSeconds}-${snippet.matchedText}`;
};

const createHighlightRegex = (value: string): RegExp | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = parts.map((part) => `\\b${part}\\b`).join("\\s+");
  return new RegExp(pattern, "gi");
};

const buildHighlightedText = (text: string, highlight: string) => {
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

export default function GameSnippetsAdminPage() {
  const auth = useAppSelector(selectAuth);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [snippets, setSnippets] = useState<PhraseSnippet[]>([]);
  const [selected, setSelected] = useState<PhraseSnippet | null>(null);
  const [pool, setPool] = useState<PoolSnippet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPhrase, setEditingPhrase] = useState("");
  const [editingTranslation, setEditingTranslation] = useState("");

  useEffect(() => {
    if (!auth.profile?.role) return;
    gameSnippetsApi
      .list(auth.profile.role)
      .then((result) => setPool(result.items.map(adaptPoolSnippet)))
      .catch(() => {
        // ignore load errors for now
      });
  }, [auth.profile?.role]);

  const handleSearch = async () => {
    const phrase = query.trim();
    if (!phrase) return;
    setLoading(true);
    try {
      const response = await videoDictionaryApi.searchPhrase({
        phrase,
        limit: 30,
        paddingSeconds: 1,
        userId: auth.profile?.id,
      });
      setSnippets(response.items);
    } finally {
      setLoading(false);
    }
  };

  const poolCount = pool.length;
  const isAdmin = auth.profile?.role === "admin";

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={{ padding: 16, color: "var(--tg-subtle)" }}>
          {TEXT.adminOnly}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={navButtonStyle}
          >
            <Icon name="back" size={18} />
          </button>
          <div style={{ fontWeight: 700 }}>{TEXT.title}</div>
          <div style={{ marginLeft: "auto", color: "var(--tg-subtle)" }}>
            {TEXT.inPool} {poolCount}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 600 }}>{TEXT.searchLabel}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={TEXT.searchPlaceholder}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={handleSearch}
              style={primaryButtonStyle}
              disabled={loading}
            >
              {loading ? TEXT.searching : TEXT.searchButton}
            </button>
          </div>
        </div>

        {snippets.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontWeight: 600 }}>{TEXT.results}</div>
            <SnippetCarousel
              items={snippets}
              onEdit={(snippet) => setSelected(snippet)}
              highlight={query}
            />
          </div>
        )}

        {selected && (
          <SnippetEditor
            snippet={selected}
            onClose={() => setSelected(null)}
            onSave={(payload) => {
              const contentId = Number(payload.contentId);
              if (!Number.isFinite(contentId)) return;
              gameSnippetsApi
                .create(
                  {
                    phrase: payload.phrase,
                    translation: payload.translation ?? null,
                    contentId,
                    startSeconds: payload.startSeconds,
                    endSeconds: payload.endSeconds,
                  },
                  auth.profile?.role
                )
                .then((item) => {
                  setPool((prev) => [adaptPoolSnippet(item), ...prev]);
                })
                .catch(() => null);
              setSelected(null);
            }}
          />
        )}

        {pool.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontWeight: 600 }}>{TEXT.currentPool}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {pool.map((snippet) => (
                <div key={`pool-${snippet.id}`} style={poolRowStyle}>
                  <div style={{ fontWeight: 600 }}>
                    {editingId === snippet.id ? (
                      <div style={{ display: "grid", gap: 6 }}>
                        <input
                          value={editingPhrase}
                          onChange={(event) =>
                            setEditingPhrase(event.target.value)
                          }
                          style={inputStyle}
                          placeholder={TEXT.searchPlaceholder}
                        />
                        <input
                          value={editingTranslation}
                          onChange={(event) =>
                            setEditingTranslation(event.target.value)
                          }
                          style={inputStyle}
                          placeholder={TEXT.translationPlaceholder}
                        />
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 4 }}>
                        <div>{snippet.phrase}</div>
                        {snippet.translation && (
                          <div
                            style={{
                              color: "var(--tg-subtle)",
                              fontSize: 12,
                            }}
                          >
                            {snippet.translation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                    {snippet.startSeconds.toFixed(2)}s -{" "}
                    {snippet.endSeconds.toFixed(2)}s
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {editingId === snippet.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const next = editingPhrase.trim();
                            if (!next) return;
                            const nextTranslation = editingTranslation.trim();
                            gameSnippetsApi
                              .update(
                                snippet.id,
                                {
                                  phrase: next,
                                  translation: nextTranslation
                                    ? nextTranslation
                                    : null,
                                },
                                auth.profile?.role
                              )
                              .then((item) => {
                                setPool((prev) =>
                                  prev.map((entry) =>
                                    entry.id === snippet.id
                                      ? adaptPoolSnippet(item)
                                      : entry
                                  )
                                );
                              })
                              .catch(() => null)
                              .finally(() => setEditingId(null));
                          }}
                          style={primaryButtonStyle}
                        >
                          {TEXT.save}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          style={ghostButtonStyle}
                        >
                          {TEXT.cancel}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(snippet.id);
                            setEditingPhrase(snippet.phrase);
                            setEditingTranslation(snippet.translation ?? "");
                          }}
                          style={ghostButtonStyle}
                        >
                          {TEXT.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            gameSnippetsApi
                              .remove(snippet.id, auth.profile?.role)
                              .then(() =>
                                setPool((prev) =>
                                  prev.filter((item) => item.id !== snippet.id)
                                )
                              )
                              .catch(() => null)
                          }
                          style={ghostButtonStyle}
                        >
                          {TEXT.remove}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function SnippetCard({
  snippet,
  isActive,
  shouldRender,
  highlight,
  onSelect,
}: {
  snippet: PhraseSnippet;
  isActive: boolean;
  shouldRender: boolean;
  highlight: string;
  onSelect: () => void;
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

  const handleTogglePlay = () => {
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
  };

  const handleTimeUpdate = () => {
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
  };

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
          onSelect();
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
        {TEXT.addToPool}
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
        aria-label={isPlaying ? TEXT.pause : TEXT.play}
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
            <Icon name="play" size={26} />
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
  onEdit,
  highlight,
}: {
  items: PhraseSnippet[];
  onEdit: (snippet: PhraseSnippet) => void;
  highlight: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardWidthRef = useRef(0);
  const scrollRaf = useRef<number | null>(null);

  const updateCardWidth = () => {
    const first = cardRefs.current[0];
    if (!first) return;
    const width = first.getBoundingClientRect().width;
    cardWidthRef.current = width;
    sliderRef.current?.style.setProperty("--card-width", `${width}px`);
  };

  const getCenteredIndex = () => {
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
  };

  useEffect(() => {
    updateCardWidth();
    const first = cardRefs.current[0];
    if (!first) return;
    const observer = new ResizeObserver(() => updateCardWidth());
    observer.observe(first);
    return () => observer.disconnect();
  }, [items.length]);

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
  }, [items.length]);

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
                onSelect={() => onEdit(snippet)}
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

function SnippetEditor({
  snippet,
  onClose,
  onSave,
}: {
  snippet: PhraseSnippet;
  onClose: () => void;
  onSave: (payload: PoolSnippet) => void;
}) {
  const [start, setStart] = useState(snippet.startSeconds);
  const [end, setEnd] = useState(snippet.endSeconds);
  const [duration, setDuration] = useState<number | null>(null);
  const [translationDraft, setTranslationDraft] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const minGap = 0.4;
  const windowPadding = 2.5;

  const maxDuration = duration ?? Math.max(2, snippet.endSeconds + windowPadding);
  const windowStart = Math.max(0, snippet.startSeconds - windowPadding);
  const windowEnd = Math.min(maxDuration, snippet.endSeconds + windowPadding);
  const safeStart = Math.max(windowStart, Math.min(start, windowEnd - minGap));
  const safeEnd = Math.min(windowEnd, Math.max(end, safeStart + minGap));

  useEffect(() => {
    if (start !== safeStart) setStart(safeStart);
    if (end !== safeEnd) setEnd(safeEnd);
  }, [end, safeEnd, safeStart, start]);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = safeStart;
    video.play().catch(() => undefined);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (video.currentTime >= safeEnd) {
        video.pause();
      }
    };
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [safeEnd]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(720px, 96vw)",
          background: "var(--tg-card)",
          borderRadius: 16,
          border: "1px solid var(--tg-border)",
          padding: 16,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700 }}>{snippet.phrase}</div>
          <button type="button" onClick={onClose} style={ghostButtonStyle}>
            {TEXT.close}
          </button>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, color: "var(--tg-subtle)" }}>
            {TEXT.translationLabel}
          </div>
          <input
            value={translationDraft}
            onChange={(event) => setTranslationDraft(event.target.value)}
            placeholder={TEXT.translationPlaceholder}
            style={inputStyle}
          />
        </div>

        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--tg-border)",
            background: "#000",
          }}
        >
          <video
            ref={videoRef}
            src={snippet.videoUrl}
            style={{ width: "100%", display: "block", height: 360 }}
            onLoadedMetadata={(event) =>
              setDuration(event.currentTarget.duration || null)
            }
            controls={false}
            playsInline
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, color: "var(--tg-subtle)" }}>
            {safeStart.toFixed(2)}s - {safeEnd.toFixed(2)}s
          </div>
          <RangeSelector
            min={windowStart}
            max={windowEnd}
            start={safeStart}
            end={safeEnd}
            minGap={minGap}
            onChange={(nextStart, nextEnd) => {
              setStart(nextStart);
              setEnd(nextEnd);
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={handlePlay} style={ghostButtonStyle}>
            {TEXT.listen}
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                ...snippet,
                startSeconds: safeStart,
                endSeconds: safeEnd,
                translation: translationDraft.trim() || null,
              })
            }
            style={primaryButtonStyle}
          >
            {TEXT.addToPool}
          </button>
        </div>
      </div>
    </div>
  );
}

function RangeSelector({
  min,
  max,
  start,
  end,
  minGap,
  onChange,
}: {
  min: number;
  max: number;
  start: number;
  end: number;
  minGap: number;
  onChange: (start: number, end: number) => void;
}) {
  const STEP = 0.05;

  return (
    <div style={{ padding: "6px 4px" }}>
      <Range
        min={min}
        max={max}
        step={STEP}
        values={[start, end]}
        onChange={(values) => {
          const nextStart = Math.min(values[0], values[1] - minGap);
          const nextEnd = Math.max(values[1], values[0] + minGap);
          onChange(nextStart, nextEnd);
        }}
        renderTrack={({ props, children }) => (
          <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
            style={{
              ...props.style,
              height: "36px",
              display: "flex",
              width: "100%",
            }}
          >
            <div
              ref={props.ref}
              style={{
                height: "4px",
                width: "100%",
                borderRadius: 999,
                background: getTrackBackground({
                  values: [start, end],
                  colors: ["rgba(255,255,255,0.12)", "#4cc4ff", "rgba(255,255,255,0.12)"],
                  min,
                  max,
                }),
                alignSelf: "center",
              }}
            >
              {children}
            </div>
          </div>
        )}
        renderThumb={({ props, index }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: 18,
              width: 18,
              borderRadius: "50%",
              backgroundColor: "#4cc4ff",
              border: "2px solid #0c1021",
              boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
              display: "grid",
              placeItems: "center",
            }}
            aria-label={index === 0 ? TEXT.start : TEXT.end}
          />
        )}
      />
    </div>
  );
}

const inputStyle: CSSProperties = {
  flex: 1,
  borderRadius: 12,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  color: "var(--tg-text)",
  padding: "10px 12px",
  fontSize: 14,
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid transparent",
  background: "linear-gradient(135deg, #2ea3ff, #6dd3ff)",
  color: "#0c1021",
  padding: "8px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const ghostButtonStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  color: "var(--tg-text)",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 600,
};

const navButtonStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  color: "var(--tg-text)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const poolRowStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

