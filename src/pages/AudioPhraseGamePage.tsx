import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAuth, setProfile } from "../features/auth/slice";
import { publicGameSnippetsApi } from "../features/game-snippets/publicApi";
import { type PhraseSnippet } from "../features/video-dictionary/api";
import { usersApi } from "../features/users/api";
import { PageShell } from "../shared/ui/PageShell";
import { Icon } from "../shared/ui/Icon";

const GAME_ROUNDS = 5;
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

const shuffleWords = (input: string[]) => {
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

export default function AudioPhraseGamePage() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const isAdmin = auth.profile?.role === "admin";

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={{ padding: 16, color: "var(--tg-subtle)" }}>
          Доступно только для администратора.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          paddingRight: 12,
          paddingLeft: 12,
        }}
      >
        <AudioPhraseGame
          userId={auth.profile?.id}
          onXp={(xpPoints) => {
            if (!auth.profile) return;
            dispatch(setProfile({ ...auth.profile, xpPoints }));
          }}
        />
      </div>
    </PageShell>
  );
}

function AudioPhraseGame({
  userId,
  onXp,
}: {
  userId?: string | null;
  onXp: (xpPoints: number) => void;
}) {
  const [currentSnippet, setCurrentSnippet] = useState<PhraseSnippet | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [gameItems, setGameItems] = useState<GameItem[]>([]);

  const currentItem = gameItems[roundIndex] ?? null;
  const currentPhrase = currentItem?.phrase ?? "";
  const currentWords = useMemo(() => {
    return currentPhrase
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);
  }, [currentPhrase]);

  useEffect(() => {
    setSlots(currentWords.map(() => null));
    const baseSet = new Set(currentWords.map((word) => word.toLowerCase()));
    const extras = shuffleWords(
      EXTRA_WORDS.filter((word) => !baseSet.has(word))
    ).slice(0, Math.min(3, Math.max(1, currentWords.length - 1)));
    setAvailableWords(shuffleWords([...currentWords, ...extras]));
    setMessage(null);
    setIsCorrect(null);
    setHasAnswered(false);
  }, [currentWords]);

  useEffect(() => {
    let cancelled = false;
    const loadPool = async () => {
      setLoading(true);
      try {
        const response = await publicGameSnippetsApi.list(GAME_ROUNDS);
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
        setGameItems(items.slice(0, GAME_ROUNDS));
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
  }, []);

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
        words.includes(word) ? words : [...words, word]
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
    setMessage(correct ? "Верно!" : "Попробуй еще раз");
    if (!correct) {
      setTimeout(() => {
        setMessage(null);
        setSlots(currentWords.map(() => null));
        setAvailableWords(shuffleWords(currentWords));
        setIsCorrect(null);
      }, 900);
      return;
    }
    setHasAnswered(true);
    if (userId) {
      usersApi
        .addXp(XP_PER_PHRASE, userId)
        .then((result) => onXp(result.xpPoints))
        .catch(() => null);
    }
  }, [currentWords, hasAnswered, onXp, gameItems.length, slots, userId]);

  const isFinished = roundIndex >= gameItems.length;

  return (
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
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700 }}>Мини-игра: Слушай и собери фразу</div>
        <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
          Раунд {Math.min(roundIndex + 1, gameItems.length)} /{" "}
          {gameItems.length}
        </div>
      </div>

      {loading && (
        <div style={{ color: "var(--tg-subtle)" }}>Загружаем фразы...</div>
      )}

      {!loading && !isFinished && currentSnippet && (
        <SnippetPlayer snippet={currentSnippet} />
      )}

      {!loading && !isFinished && !currentSnippet && (
        <div style={{ color: "var(--tg-subtle)" }}>
          Нет подходящих сниппетов в пуле.
        </div>
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
          Серия завершена! Отличная работа.
        </div>
      )}

      {!loading && !isFinished && (
        <>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
              padding: "6px 0",
            }}
          >
            {slots.map((slot, index) => (
              <div
                key={`slot-${index}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const word = event.dataTransfer.getData("text/plain");
                  if (!word) return;
                  handleWordDrop(word, index);
                }}
                style={{
                  minWidth: 70,
                  minHeight: 36,
                  borderRadius: 10,
                  border: slot
                    ? "2px solid var(--tg-accent)"
                    : "2px dashed rgba(76,196,255,0.55)",
                  background: slot
                    ? "rgba(76,196,255,0.12)"
                    : "rgba(255,255,255,0.06)",
                  boxShadow: slot
                    ? "0 0 0 1px rgba(76,196,255,0.35)"
                    : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "4px 8px",
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
                    title="Нажмите, чтобы вернуть"
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
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--tg-border)",
                background: "var(--tg-surface)",
                minHeight: 52,
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
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--tg-border)",
                    background: "var(--tg-card)",
                    fontWeight: 600,
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
          {isCorrect && (
            <button
              type="button"
              onClick={() =>
                setRoundIndex((idx) => Math.min(idx + 1, gameItems.length))
              }
              style={{
                alignSelf: "center",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(76,196,255,0.55)",
                background: "rgba(76,196,255,0.18)",
                color: "#e9f7ff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              Далее
            </button>
          )}
        </>
      )}
    </div>
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
        borderRadius: 14,
        overflow: "hidden",
        background: "#000",
        border: "1px solid var(--tg-border)",
        maxWidth: 300,
        width: "100%",
        margin: "0 auto",
        maxHeight: 400,
        position: "relative",
      }}
    >
      <video
        ref={videoRef}
        src={snippet.videoUrl}
        style={{
          width: "100%",
          display: "block",
          height: 400,
          objectFit: "cover",
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
