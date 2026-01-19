import { useEffect, useMemo, useRef, useState } from "react";
import { publicGameSnippetsApi } from "../game-snippets/publicApi";
import { type PhraseSnippet } from "../video-dictionary/api";
import { usersApi } from "../users/api";
import { Icon } from "../../shared/ui/Icon";

const XP_PER_PHRASE = 25;
const EXTRA_WORDS = [
  "a",
  "an",
  "the",
  "to",
  "in",
  "on",
  "with",
  "for",
  "and",
  "or",
  "but",
  "not",
  "do",
  "did",
  "does",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "have",
  "has",
  "had",
  "can",
  "could",
  "will",
  "would",
  "should",
  "this",
  "that",
  "here",
  "there",
  "now",
  "then",
  "what",
  "why",
  "how",
];

const TEXT = {
  title:
    "\u041c\u0438\u043d\u0438-\u0438\u0433\u0440\u0430: \u0421\u043b\u0443\u0448\u0430\u0439 \u0438 \u0441\u043e\u0431\u0435\u0440\u0438 \u0444\u0440\u0430\u0437\u0443",
  round: "\u0420\u0430\u0443\u043d\u0434",
  loading:
    "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0444\u0440\u0430\u0437\u044b...",
  empty:
    "\u041d\u0435\u0442 \u043f\u043e\u0434\u0445\u043e\u0434\u044f\u0449\u0438\u0445 \u0441\u043d\u0438\u043f\u043f\u0435\u0442\u043e\u0432 \u0432 \u043f\u0443\u043b\u0435.",
  finished:
    "\u0421\u0435\u0440\u0438\u044f \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430! \u041e\u0442\u043b\u0438\u0447\u043d\u0430\u044f \u0440\u0430\u0431\u043e\u0442\u0430.",
  correct: "\u0412\u0435\u0440\u043d\u043e!",
  retry:
    "\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0435 \u0440\u0430\u0437",
  skip: "\u041f\u0440\u043e\u043f\u0443\u0441\u0442\u0438\u0442\u044c",
  next: "\u0414\u0430\u043b\u0435\u0435",
  slotHint:
    "\u041d\u0430\u0436\u043c\u0438\u0442\u0435, \u0447\u0442\u043e\u0431\u044b \u0432\u0435\u0440\u043d\u0443\u0442\u044c",
};

const normalizePhrase = (value: string) => value.replace(/[,.!?]/g, "");

const shuffleWords = (input: string[]) => {
  const next = [...input];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const shuffleItems = <T,>(input: T[]) => {
  const next = [...input];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

type GameItem = PhraseSnippet & {
  translation?: string | null;
};

type AudioPhraseGameProps = {
  userId?: string | null;
  onXp: (xpPoints: number) => void;
  maxRounds?: number;
  showHeader?: boolean;
  difficulty?: 1 | 2 | 3;
  showSkip?: boolean;
};

export default function AudioPhraseGame({
  userId,
  onXp,
  maxRounds = 1,
  showHeader = false,
  difficulty = 1,
  showSkip = false,
}: AudioPhraseGameProps) {
  const [currentSnippet, setCurrentSnippet] = useState<PhraseSnippet | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [gameItems, setGameItems] = useState<GameItem[]>([]);

  const currentItem = gameItems[roundIndex] ?? null;
  const currentPhrase = normalizePhrase(currentItem?.phrase ?? "");
  const currentWords = useMemo(() => {
    return currentPhrase
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);
  }, [currentPhrase]);

  useEffect(() => {
    setSlots(currentWords.map(() => null));
    const baseSet = new Set(currentWords.map((word) => word.toLowerCase()));
    const targetExtraCount = difficulty === 1 ? 0 : difficulty === 2 ? 3 : 6;
    const extras =
      targetExtraCount === 0
        ? []
        : shuffleWords(EXTRA_WORDS.filter((word) => !baseSet.has(word))).slice(
            0,
            targetExtraCount,
          );
    setAvailableWords(shuffleWords([...currentWords, ...extras]));
    setMessage(null);
    setIsCorrect(null);
    setHasAnswered(false);
  }, [currentWords, difficulty]);

  useEffect(() => {
    let cancelled = false;
    const loadPool = async () => {
      setLoading(true);
      try {
        const response = await publicGameSnippetsApi.list(maxRounds);
        if (cancelled) return;
        const items =
          response.items?.map((item) => ({
            id: item.id,
            contentId: String(item.contentId),
            videoName: item.videoName ?? "",
            videoUrl: item.videoUrl ?? "",
            startSeconds: item.startSeconds,
            endSeconds: item.endSeconds,
            matchedText: "",
            contextText: item.phrase,
            phrase: item.phrase,
            translation: item.translation ?? null,
            durationSeconds: null,
          })) ?? [];
        setGameItems(shuffleItems(items).slice(0, maxRounds));
      } catch {
        if (!cancelled) setGameItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPool();
    return () => {
      cancelled = true;
    };
  }, [maxRounds]);

  useEffect(() => {
    setCurrentSnippet(currentItem ?? null);
  }, [currentItem]);

  const handleWordDrop = (word: string, slotIndex: number) => {
    setSlots((prev) => {
      if (prev[slotIndex]) return prev;
      const next = [...prev];
      next[slotIndex] = word;
      return next;
    });
    setAvailableWords((prev) => prev.filter((w) => w !== word));
  };

  const handleReturnWord = (word: string) => {
    setSlots((prev) => prev.map((w) => (w === word ? null : w)));
    setAvailableWords((prev) => (prev.includes(word) ? prev : [...prev, word]));
  };

  const handleWordClick = (word: string) => {
    setSlots((prev) => {
      const idx = prev.findIndex((slot) => !slot);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = word;
      return next;
    });
    setAvailableWords((prev) => prev.filter((w) => w !== word));
  };

  const handleSlotClick = (slotIndex: number) => {
    setSlots((prev) => {
      const word = prev[slotIndex];
      if (!word) return prev;
      const next = [...prev];
      next[slotIndex] = null;
      setAvailableWords((words) =>
        words.includes(word) ? words : [...words, word],
      );
      return next;
    });
  };

  useEffect(() => {
    if (hasAnswered) return;
    if (!slots.length || slots.some((slot) => !slot)) return;
    const answer = slots.join(" ").toLowerCase();
    const target = currentWords.join(" ").toLowerCase();
    const correct = answer === target;
    setIsCorrect(correct);
    setMessage(correct ? TEXT.correct : TEXT.retry);
    if (!correct) {
      setShowCheck(true);
      setTimeout(() => {
        setMessage(null);
        setSlots(currentWords.map(() => null));
        setAvailableWords(shuffleWords(currentWords));
        setIsCorrect(null);
        setShowCheck(false);
      }, 2500);
      return;
    }
    setHasAnswered(true);
    if (userId) {
      usersApi
        .addXp(XP_PER_PHRASE, userId)
        .then((result) => onXp(result.xpPoints))
        .catch(() => null);
    }
  }, [currentWords, hasAnswered, onXp, maxRounds, slots, userId]);

  const isFinished = roundIndex >= gameItems.length;

  return (
    <>
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--tg-border)",
          background: "var(--tg-card)",
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
      <style>
        {`@keyframes slot-wiggle {
  0% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
  100% { transform: translateX(0); }
}

body[data-theme='light'] .apg-slot--empty {
  border-color: rgba(0, 0, 0, 0.35) !important;
  background: rgba(0, 0, 0, 0.03) !important;
}

body[data-theme='light'] .apg-word {
  border-color: rgba(0, 0, 0, 0.2) !important;
  background: rgba(0, 0, 0, 0.08) !important;
  color: #0b1b2b !important;
}

body[data-theme='light'] .apg-next {
  border-color: rgba(0, 0, 0, 0.25) !important;
  background: rgba(46, 163, 255, 0.18) !important;
  color: #0b1b2b !important;
}
}`}
      </style>
        {showHeader && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700 }}>{TEXT.title}</div>
            <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
              {TEXT.round} {Math.min(roundIndex + 1, gameItems.length)} /{" "}
              {gameItems.length}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ color: "var(--tg-subtle)" }}>{TEXT.loading}</div>
        )}

        {!loading && !isFinished && currentSnippet && (
          <>
            <div
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: 22,
                marginBottom: 6,
              }}
            >
              {
                "\u0427\u0442\u043e \u0442\u0443\u0442 \u0433\u043e\u0432\u043e\u0440\u0438\u0442\u0441\u044f?"
              }
            </div>
            <SnippetPlayer snippet={currentSnippet} />
          </>
        )}

        {!loading && !isFinished && !currentSnippet && (
          <div style={{ color: "var(--tg-subtle)" }}>{TEXT.empty}</div>
        )}

        {!loading && isFinished && (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(46, 163, 255, 0.08)",
              color: "var(--tg-text)",
              fontWeight: 700,
            }}
          >
            {TEXT.finished}
          </div>
        )}

        {!loading && !isFinished && (
          <>
            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                justifyContent: "center",
                padding: "16px 0 8px",
              }}
            >
              {slots.map((slot, index) => (
              <div
                key={`slot-${index}`}
                className={`apg-slot ${slot ? "apg-slot--filled" : "apg-slot--empty"}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const word = event.dataTransfer.getData("text/plain");
                  if (!word) return;
                    handleWordDrop(word, index);
                  }}
                  style={{
                    minWidth: 72,
                    minHeight: 32,
                    borderRadius: 10,
                    border:
                      showCheck && slot
                        ? slot.toLowerCase() ===
                          (currentWords[index] ?? "").toLowerCase()
                          ? "1px dashed rgba(53,199,89,0.9)"
                          : "1px dashed rgba(255,107,107,0.9)"
                        : isCorrect && slot
                          ? "1px dashed rgba(53,199,89,0.9)"
                          : slot
                            ? "1px dashed var(--tg-accent)"
                            : "1px dashed rgba(76,196,255,0.55)",
                    background:
                      showCheck && slot
                        ? slot.toLowerCase() ===
                          (currentWords[index] ?? "").toLowerCase()
                          ? "rgba(53,199,89,0.12)"
                          : "rgba(255,107,107,0.12)"
                        : isCorrect && slot
                          ? "rgba(53,199,89,0.12)"
                          : slot
                            ? "rgba(76,196,255,0.1)"
                            : "rgba(255,255,255,0.04)",
                    boxShadow:
                      showCheck && slot
                        ? slot.toLowerCase() ===
                          (currentWords[index] ?? "").toLowerCase()
                          ? "0 0 0 1px rgba(53,199,89,0.2)"
                          : "0 0 0 1px rgba(255,107,107,0.2)"
                        : isCorrect && slot
                          ? "0 0 0 1px rgba(53,199,89,0.2)"
                          : slot
                            ? "0 0 0 1px rgba(76,196,255,0.25)"
                            : "inset 0 0 0 1px rgba(255,255,255,0.04)",
                    backgroundImage: "none",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "4px 8px",
                    animation:
                      showCheck &&
                      slot &&
                      slot.toLowerCase() !==
                        (currentWords[index] ?? "").toLowerCase()
                        ? "slot-wiggle 0.35s ease-in-out 2"
                        : "none",
                  }}
                >
                  {slot && (
                    <span
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", slot);
                      }}
                      style={{ cursor: "grab" }}
                      onClick={() => handleSlotClick(index)}
                      title={TEXT.slotHint}
                    >
                      {slot}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {!isCorrect && (
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const word = event.dataTransfer.getData("text/plain");
                  if (!word) return;
                  handleReturnWord(word);
                }}
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  padding: "2px 0",
                }}
              >
                {availableWords.map((word) => (
                <div
                  key={word}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", word);
                  }}
                  onClick={() => handleWordClick(word)}
                  className="apg-word"
                  style={{
                    minHeight: 32,
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(114, 189, 227, 0.311)",
                      color: "#eef7ff",
                      fontWeight: 500,
                      fontSize: 18,
                      cursor: "grab",
                    }}
                  >
                    {word}
                  </div>
                ))}
              </div>
            )}

            {message && (
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  color: isCorrect ? "#35c759" : "#ff6b6b",
                }}
              >
                {message}
              </div>
            )}
            {isCorrect && currentItem && (
              <div
                style={{
                  textAlign: "center",
                  display: "grid",
                  gap: 6,
                  color: "var(--tg-text)",
                }}
              >
                <div style={{ fontWeight: 700 }}>{currentItem.phrase}</div>
                {currentItem.translation && (
                  <div style={{ color: "var(--tg-subtle)" }}>
                    {currentItem.translation}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {isCorrect && (
              <button
                type="button"
                onClick={() =>
                  setRoundIndex((idx) => Math.min(idx + 1, gameItems.length))
                }
                className="apg-next"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid rgba(76,196,255,0.55)",
                    background: "rgba(76,196,255,0.18)",
                    color: "#e9f7ff",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {TEXT.next}
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {showSkip && !isFinished && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() =>
              setRoundIndex((idx) => Math.min(idx + 1, gameItems.length))
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid var(--tg-border)",
              background: "transparent",
              color: "var(--tg-text)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {TEXT.skip}
          </button>
        </div>
      )}
    </>
  );
}

function SnippetPlayer({ snippet }: { snippet: PhraseSnippet }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (video.currentTime >= snippet.endSeconds) {
        video.pause();
        setEnded(true);
      }
    };
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [snippet.endSeconds, snippet.startSeconds]);

  return (
    <div
      style={{
        borderRadius: "50%",
        overflow: "hidden",
        background: "#000",
        border: "1px solid var(--tg-border)",
        width: 300,
        height: 300,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <video
        ref={videoRef}
        src={snippet.videoUrl}
        style={{
          width: "100%",
          display: "block",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 40%",
        }}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          video.currentTime = snippet.startSeconds;
          video.play().catch(() => undefined);
          setEnded(false);
        }}
        onClick={() => {
          const video = videoRef.current;
          if (!video) return;
          if (!video.paused) {
            video.pause();
            return;
          }
          video.currentTime = snippet.startSeconds;
          video.play().catch(() => undefined);
          setEnded(false);
        }}
        onPlay={() => setEnded(false)}
        controls={false}
        playsInline
        muted={false}
      />
      {ended && (
        <div
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = snippet.startSeconds;
            video.play().catch(() => undefined);
            setEnded(false);
          }}
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <Icon name="replay" size={44} color="#fff" />
        </div>
      )}
    </div>
  );
}
