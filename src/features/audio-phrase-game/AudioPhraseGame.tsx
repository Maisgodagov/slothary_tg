import { useEffect, useMemo, useRef, useState } from "react";
import {
  publicGameSnippetsApi,
  type PublicGameSnippetGame,
} from "../game-snippets/publicApi";
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
  translationTitle:
    "\u0412\u044b\u0431\u0435\u0440\u0438 \u043f\u0435\u0440\u0435\u0432\u043e\u0434",
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
const countWords = (value: string) =>
  normalizePhrase(value)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean).length;

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

const uniqueById = <T extends { id: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

type GameSnippet = Omit<
  PublicGameSnippetGame,
  "videoUrl" | "videoName" | "contentId"
> & {
  videoUrl: string;
  videoName: string;
  contentId: string;
};

type GamePhase = "translate" | "missing" | "oddword" | "assemble";

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
  const [currentSnippet, setCurrentSnippet] = useState<GameSnippet | null>(null);
  const [loading, setLoading] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [gameItems, setGameItems] = useState<GameSnippet[]>([]);
  const [poolItems, setPoolItems] = useState<GameSnippet[]>([]);
  const [phase, setPhase] = useState<GamePhase>("translate");
  const [questionMessage, setQuestionMessage] = useState<string | null>(null);
  const [questionCorrect, setQuestionCorrect] = useState<boolean | null>(null);
  const [missingIndices, setMissingIndices] = useState<number[]>([]);
  const [missingSlots, setMissingSlots] = useState<(string | null)[]>([]);
  const [missingOptions, setMissingOptions] = useState<string[]>([]);
  const [missingShake, setMissingShake] = useState(false);
  const missingOptionsRef = useRef<string[]>([]);
  const [oddWordOptions, setOddWordOptions] = useState<string[]>([]);
  const [oddWordAnswer, setOddWordAnswer] = useState<string | null>(null);
  const [selectedOddWord, setSelectedOddWord] = useState<string | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(
    null,
  );
  const [oddWordShake, setOddWordShake] = useState(false);
  const [lives, setLives] = useState(3);
  const [isAnswerWrong, setIsAnswerWrong] = useState(false);
  const phaseCountsRef = useRef<Record<GamePhase, number>>({
    translate: 0,
    missing: 0,
    oddword: 0,
    assemble: 0,
  });
  const seenSnippetIdsRef = useRef<Set<string>>(new Set());

  const currentItem = gameItems[roundIndex] ?? null;
  const outOfLives = lives <= 0;
  const currentPhrase = normalizePhrase(currentItem?.phrase ?? "");
  const currentWords = useMemo(() => {
    return currentPhrase
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);
  }, [currentPhrase]);
  const translationOptions = currentItem?.translationOptions ?? [];
  const showTranslationQuestion = translationOptions.length >= 2;
  const showMissingQuestion =
    missingIndices.length > 0 && currentWords.length >= 2;
  const showOddWordQuestion =
    Boolean(oddWordAnswer) && currentWords.length >= 3;
  const showAssembleQuestion = countWords(currentPhrase) >= 3 && countWords(currentPhrase) <= 7;

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
    if (!currentItem) return;
    const availablePhases: GamePhase[] = [];
    if (showAssembleQuestion) availablePhases.push("assemble");
    if (showTranslationQuestion) availablePhases.push("translate");
    if (showMissingQuestion) availablePhases.push("missing");
    if (showOddWordQuestion) availablePhases.push("oddword");
    const counts = phaseCountsRef.current;
    const minCount = availablePhases.reduce(
      (min, phaseKey) => Math.min(min, counts[phaseKey]),
      Number.POSITIVE_INFINITY,
    );
    const leastUsed = availablePhases.filter(
      (phaseKey) => counts[phaseKey] === minCount,
    );
    const nextPhase = shuffleItems(leastUsed)[0] ?? "translate";
    setPhase(nextPhase);
    phaseCountsRef.current = {
      ...counts,
      [nextPhase]: counts[nextPhase] + 1,
    };
    setQuestionMessage(null);
    setQuestionCorrect(null);
  }, [
    currentItem,
    showTranslationQuestion,
    showMissingQuestion,
    showOddWordQuestion,
    showAssembleQuestion,
  ]);

  useEffect(() => {
    if (!currentWords.length) {
      setMissingIndices([]);
      setMissingSlots([]);
      setMissingOptions([]);
      setOddWordOptions([]);
      setOddWordAnswer(null);
      return;
    }

    const poolWords = poolItems
      .flatMap((item) =>
        normalizePhrase(item.phrase)
          .split(/\s+/)
          .map((word) => word.trim())
          .filter(Boolean),
      )
      .filter((word) => !currentWords.includes(word));

    const uniquePoolWords = Array.from(new Set(poolWords));
    const wordIndices = currentWords.map((_, idx) => idx);
    const missingCount = currentWords.length >= 6 ? 2 : 1;
    const shuffledIndices = shuffleItems(wordIndices)
      .slice(0, missingCount)
      .sort((a, b) => a - b);
    const targetWords = shuffledIndices.map((idx) => currentWords[idx]);
    const distractors = shuffleItems(
      uniquePoolWords.filter((word) => word.length >= 2),
    ).slice(0, Math.max(2, missingCount + 1));
    const options = shuffleItems(
      Array.from(new Set([...targetWords, ...distractors])),
    );
    setMissingIndices(shuffledIndices);
    setMissingSlots(shuffledIndices.map(() => null));
    setMissingOptions(options);
    missingOptionsRef.current = options;

    const extraFallback = shuffleItems(
      EXTRA_WORDS.filter((word) => !currentWords.includes(word)),
    )[0];
    const oddWord =
      shuffleItems(
        uniquePoolWords.filter(
          (word) => !currentWords.includes(word) && word.length > 1,
        ),
      )[0] ?? extraFallback ?? "";
    const uniquePhraseWords = Array.from(
      new Set(currentWords.map((word) => word.toLowerCase())),
    );
    const baseWordCount = Math.min(5, uniquePhraseWords.length);
    const phraseOptions = shuffleItems(uniquePhraseWords).slice(0, baseWordCount);
    const oddOptions = oddWord
      ? shuffleItems(Array.from(new Set([...phraseOptions, oddWord])))
      : shuffleItems(Array.from(new Set(phraseOptions)));
    setOddWordOptions(oddOptions);
    setOddWordAnswer(oddWord || null);
  }, [currentWords, poolItems]);

  useEffect(() => {
    let cancelled = false;
    const loadPool = async () => {
      setLoading(true);
      try {
        const response = await publicGameSnippetsApi.listGame({
          limit: Math.max(maxRounds * 3, maxRounds),
          minWords: 1,
        });
        if (cancelled) return;
        const items =
          response.items?.map((item) => ({
            id: item.id,
            contentId: String(item.contentId),
            videoName: item.videoName ?? "",
            videoUrl: item.videoUrl ?? "",
            startSeconds: item.startSeconds,
            endSeconds: item.endSeconds,
            phrase: item.phrase,
            translation: item.translation ?? null,
            translationOptions: item.translationOptions ?? [],
          })) ?? [];
        const uniqueItems = uniqueById(items);
        const unseenItems = uniqueItems.filter(
          (item) => !seenSnippetIdsRef.current.has(item.id),
        );
        unseenItems.forEach((item) => {
          seenSnippetIdsRef.current.add(item.id);
        });
        const effectiveItems = unseenItems.length ? unseenItems : uniqueItems;
        setPoolItems(uniqueItems);
        setGameItems(shuffleItems(effectiveItems).slice(0, maxRounds));
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
    setSelectedTranslation(null);
    setSelectedOddWord(null);
    setQuestionMessage(null);
    setQuestionCorrect(null);
    setMissingSlots((prev) => prev.map(() => null));
    setIsAnswerWrong(false);
    setOddWordShake(false);
    setMissingShake(false);
  }, [currentItem]);

  useEffect(() => {
    if (phase === "missing" && !showMissingQuestion) {
      setPhase(showOddWordQuestion ? "oddword" : "assemble");
    }
  }, [phase, showMissingQuestion, showOddWordQuestion]);

  useEffect(() => {
    if (phase === "oddword" && !showOddWordQuestion) {
      setPhase("assemble");
    }
  }, [phase, showOddWordQuestion]);

  useEffect(() => {
    setQuestionMessage(null);
    setIsAnswerWrong(false);
  }, [phase]);

  const advancePhase = () => {
    setQuestionMessage(null);
    setQuestionCorrect(null);
    setMissingSlots([]);
    setMissingIndices([]);
    setRoundIndex((idx) => Math.min(idx + 1, gameItems.length));
  };

  const handleTranslationAnswer = (value: string) => {
    if (!currentItem || questionCorrect || outOfLives) return;
    setQuestionMessage(null);
    setIsAnswerWrong(false);
    const correct = value === currentItem.translation;
    setSelectedTranslation(value);
    if (correct) {
      setQuestionCorrect(true);
      setQuestionMessage(TEXT.correct);
      setIsAnswerWrong(false);
      return;
    }
    setQuestionMessage("Неверно. Попробуй еще раз");
    setIsAnswerWrong(true);
    setLives((prev) => Math.max(prev - 1, 0));
    setTimeout(() => {
      setIsAnswerWrong(false);
    }, 2000);
  };

  const handleMissingPick = (value: string) => {
    if (questionCorrect !== null || outOfLives) return;
    setQuestionMessage(null);
    setIsAnswerWrong(false);
    setMissingSlots((prev) => {
      const idx = prev.findIndex((slot) => !slot);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = value;
      return next;
    });
    setMissingOptions((prev) => prev.filter((option) => option !== value));
  };

  useEffect(() => {
    if (phase !== "missing") return;
    if (questionCorrect !== null) return;
    if (outOfLives) return;
    if (!missingSlots.length || missingSlots.some((slot) => !slot)) return;
    const isCorrectMissing = missingIndices.every(
      (idx, i) =>
        String(missingSlots[i]).toLowerCase() ===
        String(currentWords[idx]).toLowerCase(),
    );
    if (isCorrectMissing) {
      setQuestionCorrect(true);
      setQuestionMessage(TEXT.correct);
      setIsAnswerWrong(false);
      return;
    }
    setQuestionMessage("Неверно. Попробуй еще раз");
    setIsAnswerWrong(true);
    setMissingShake(true);
    setLives((prev) => Math.max(prev - 1, 0));
    setTimeout(() => {
      setMissingShake(false);
      setIsAnswerWrong(false);
      setMissingSlots((prev) => prev.map(() => null));
      setMissingOptions([...missingOptionsRef.current]);
    }, 2000);
  }, [phase, questionCorrect, missingSlots, missingIndices, currentWords, outOfLives]);

  const handleMissingRemove = (slotIndex: number) => {
    if (questionCorrect !== null || outOfLives) return;
    setQuestionMessage(null);
    setIsAnswerWrong(false);
    setMissingSlots((prev) => {
      const next = [...prev];
      const value = next[slotIndex];
      next[slotIndex] = null;
      if (value) {
        setMissingOptions((options) =>
          options.includes(value) ? options : [...options, value],
        );
      }
      return next;
    });
  };

  const handleOddWordPick = (value: string) => {
    if (questionCorrect || outOfLives) return;
    setQuestionMessage(null);
    setIsAnswerWrong(false);
    const correct = value === oddWordAnswer;
    setSelectedOddWord(value);
    if (correct) {
      setQuestionCorrect(true);
      setQuestionMessage(TEXT.correct);
      setIsAnswerWrong(false);
      return;
    }
    setQuestionMessage("Неверно. Попробуй еще раз");
    setIsAnswerWrong(true);
    setOddWordShake(true);
    setLives((prev) => Math.max(prev - 1, 0));
    setTimeout(() => {
      setOddWordShake(false);
      setIsAnswerWrong(false);
    }, 2000);
  };

  const handleWordDrop = (word: string, slotIndex: number) => {
    if (outOfLives) return;
    setSlots((prev) => {
      if (prev[slotIndex]) return prev;
      const next = [...prev];
      next[slotIndex] = word;
      return next;
    });
    setAvailableWords((prev) => prev.filter((w) => w !== word));
  };

  const handleReturnWord = (word: string) => {
    if (outOfLives) return;
    setSlots((prev) => prev.map((w) => (w === word ? null : w)));
    setAvailableWords((prev) => (prev.includes(word) ? prev : [...prev, word]));
  };

  const handleWordClick = (word: string) => {
    if (outOfLives) return;
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
    if (outOfLives) return;
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
    if (outOfLives) return;
    const answer = slots.join(" ").toLowerCase();
    const target = currentWords.join(" ").toLowerCase();
    const correct = answer === target;
    setIsCorrect(correct);
    setMessage(correct ? TEXT.correct : "Неверно. Попробуй еще раз");
    if (!correct) {
      setLives((prev) => Math.max(prev - 1, 0));
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
  }, [currentWords, hasAnswered, onXp, maxRounds, slots, userId, outOfLives]);

  const isFinished = roundIndex >= gameItems.length;

  return (
    <>
      <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <span
              key={`life-${index}`}
              style={{
                fontSize: 18,
                opacity: index < lives ? 1 : 0.2,
              }}
            >
              ❤️
            </span>
          ))}
        </div>
        {!loading && !isFinished && currentSnippet && (
          <div
            style={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {phase === "translate"
              ? TEXT.translationTitle
              : phase === "missing"
                ? "Вставь пропущенные слова"
              : phase === "oddword"
                ? "Какого слова тут нет?"
              : phase === "assemble"
                ? "Собери фразу"
                : "\u0427\u0442\u043e \u0442\u0443\u0442 \u0433\u043e\u0432\u043e\u0440\u0438\u0442\u0441\u044f?"}
          </div>
        )}
      </div>
      <div
        style={{
          borderRadius: 32,
          background: "#1f2b3a",
          padding: 18,
          display: "grid",
          gap: 8,
          width: "100%",
          minHeight: "calc(100vh - 260px)",
          margin: "0 auto",
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
            <SnippetPlayer snippet={currentSnippet} />
          </>
        )}

        {!loading && !isFinished && !currentSnippet && (
          <div style={{ color: "var(--tg-subtle)" }}>{TEXT.empty}</div>
        )}

        {!loading && outOfLives && (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,107,107,0.12)",
              color: "var(--tg-text)",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Игра окончена. Жизни закончились.
          </div>
        )}

        {!loading && isFinished && !outOfLives && (
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

        {!loading && !isFinished && !outOfLives && phase === "translate" && showTranslationQuestion && (
          <div style={{ display: "grid", gap: 10 }}>
            <div
              style={{
                display: "grid",
                gap: 8,
                justifyItems: "center",
              }}
            >
              {translationOptions.map((option) => (
                <button
                  key={`translation-${option}`}
                  type="button"
                  onClick={() => handleTranslationAnswer(option)}
                  disabled={questionCorrect !== null || outOfLives}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--tg-border)",
                    background:
                      questionCorrect || isAnswerWrong
                        ? option === currentItem?.translation && questionCorrect
                          ? "rgba(53,199,89,0.18)"
                          : option === selectedTranslation && isAnswerWrong
                            ? "rgba(255,107,107,0.18)"
                            : "var(--tg-border)"
                        : "var(--tg-border)",
                    color: "var(--tg-text)",
                    cursor: questionCorrect ? "default" : "pointer",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: 18,
                    width: "min(360px, 100%)",
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            {questionMessage && (
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  color: questionCorrect ? "#35c759" : "#ff6b6b",
                }}
              >
                {questionMessage}
              </div>
            )}
            {(questionCorrect !== null || outOfLives) && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={advancePhase}
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
                    fontSize: 18,
                  }}
                >
                  {TEXT.next}
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && !isFinished && !outOfLives && phase === "missing" && showMissingQuestion && (
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                textAlign: "center",
                fontWeight: 700,
                lineHeight: 1.6,
                fontSize: 18,
              }}
            >
              {currentWords.map((word, index) => {
                const missingIndex = missingIndices.indexOf(index);
                if (missingIndex === -1) {
                  return <span key={`word-${index}`}>{word} </span>;
                }
                const slotValue = missingSlots[missingIndex];
                const isSlotCorrect =
                  slotValue &&
                  slotValue.toLowerCase() === currentWords[index]?.toLowerCase();
                const showSlotCheck = questionCorrect !== null || isAnswerWrong;
                return (
                  <span
                    key={`missing-${index}`}
                    onClick={() => handleMissingRemove(missingIndex)}
                    style={{
                      display: "inline-flex",
                      minWidth: 64,
                      padding: "2px 8px",
                      margin: "0 4px",
                      borderRadius: 8,
                      border: showSlotCheck
                        ? isSlotCorrect
                          ? "1px dashed rgba(53,199,89,0.9)"
                          : "1px dashed rgba(255,107,107,0.9)"
                        : "1px dashed rgba(76,196,255,0.55)",
                      background: showSlotCheck
                        ? isSlotCorrect
                          ? "rgba(53,199,89,0.12)"
                          : "rgba(255,107,107,0.12)"
                        : "rgba(76,196,255,0.1)",
                      cursor: slotValue ? "pointer" : "default",
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      animation:
                        missingShake && isAnswerWrong
                          ? "slot-wiggle 0.35s ease-in-out 2"
                          : "none",
                    }}
                  >
                    {slotValue ?? "_____"}
                  </span>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {missingOptions.map((option) => (
                <button
                  key={`missing-option-${option}`}
                  type="button"
                  onClick={() => handleMissingPick(option)}
                  disabled={questionCorrect !== null || outOfLives}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--tg-border)",
                    background: "var(--tg-border)",
                    color: "var(--tg-text)",
                    cursor: "pointer",
                    fontWeight: 600,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    height: 36,
                    alignItems: "center",
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            {questionMessage && (
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  color: questionCorrect ? "#35c759" : "#ff6b6b",
                }}
              >
                {questionMessage}
              </div>
            )}
            {questionCorrect !== null && (
              <div style={{ display: "grid", gap: 10 }}>
                {currentItem && (
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
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={advancePhase}
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
                </div>
              </div>
            )}
            {outOfLives && questionCorrect === null && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={advancePhase}
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
                    fontSize: 22,
                  }}
                >
                  {TEXT.next}
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && !isFinished && !outOfLives && phase === "oddword" && showOddWordQuestion && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {oddWordOptions.map((option) => (
                <button
                  key={`odd-option-${option}`}
                  type="button"
                  onClick={() => handleOddWordPick(option)}
                  disabled={questionCorrect !== null || outOfLives}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--tg-border)",
                    background:
                      questionCorrect || isAnswerWrong
                        ? option === oddWordAnswer && questionCorrect
                          ? "rgba(53,199,89,0.18)"
                          : option === selectedOddWord && isAnswerWrong
                            ? "rgba(255,107,107,0.18)"
                            : "var(--tg-border)"
                        : "var(--tg-border)",
                    color: "var(--tg-text)",
                    cursor: "pointer",
                    fontWeight: 600,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    animation:
                      oddWordShake &&
                      option === selectedOddWord &&
                      isAnswerWrong
                        ? "slot-wiggle 0.35s ease-in-out 2"
                        : "none",
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            {questionMessage && (
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  color: questionCorrect ? "#35c759" : "#ff6b6b",
                }}
              >
                {questionMessage}
              </div>
            )}
            {(questionCorrect !== null || outOfLives) && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={advancePhase}
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
                    fontSize: 18,
                  }}
                >
                  {TEXT.next}
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && !isFinished && !outOfLives && phase === "assemble" && (
          <>
            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                justifyContent: "center",
                padding: "10px 0 6px",
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
                    backgroundColor:
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
                    display: "grid",
                    placeItems: "center",
                    fontSize: 16,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    padding: "6px 10px",
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
                  gap: 10,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  padding: "6px 0 2px",
                }}
              >
                {availableWords.map((word, index) => (
                <div
                  key={`${word}-${index}`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", word);
                  }}
                  onClick={() => handleWordClick(word)}
                  className="apg-word"
                  style={{
                    minHeight: 30,
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#e8f0ff",
                    fontWeight: 600,
                    fontSize: 18,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
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
              {(isCorrect || outOfLives) && (
              <button
                type="button"
                onClick={advancePhase}
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={advancePhase}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.06)",
              color: "#c7d4e8",
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

function SnippetPlayer({ snippet }: { snippet: GameSnippet }) {
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
        border: "5px solid var(--tg-border)",
        width: 300,
        height: 300,
        margin: "12px auto 0",
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
