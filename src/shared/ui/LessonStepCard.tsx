import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SnippetPlayer } from "../../modules/audio-phrase-game/components/SnippetPlayer";

export type LessonStepSnippet = {
  id?: string;
  videoUrl?: string | null;
  startSeconds: number;
  endSeconds: number;
  description?: string | null;
};

export interface LessonStepCardProps {
  variant?: "justWatch" | "quiz" | "fillGap" | "assemble";
  title: string;
  text: string;
  snippets: LessonStepSnippet[];
  answers?: { id: string; text: string; isCorrect: boolean }[];
  gapSentenceParts?: string[];
  gapCorrectWords?: string[];
  gapOptions?: string[];
  assembleWords?: string[];
  onNext: () => void;
}

export function LessonStepCard({
  variant = "justWatch",
  title,
  text,
  snippets,
  answers = [],
  gapSentenceParts = [],
  gapCorrectWords = [],
  gapOptions = [],
  assembleWords = [],
  onNext,
}: LessonStepCardProps) {
  const ordered = useMemo(() => snippets.filter(Boolean), [snippets]);
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollRaf = useRef<number | null>(null);
  const activeSnippet = ordered[activeIndex];
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [answeredCorrect, setAnsweredCorrect] = useState<boolean | null>(null);
  const totalGaps = gapCorrectWords.length;
  const [gapSelections, setGapSelections] = useState<string[]>(
    totalGaps > 0 ? Array(totalGaps).fill("") : []
  );
  const [gapChecked, setGapChecked] = useState(false);
  const [assembleSelections, setAssembleSelections] = useState<string[]>([]);
  const [assembleChecked, setAssembleChecked] = useState(false);
  const shuffledAssembleOptions = useMemo(() => {
    if (assembleWords.length === 0) return [];
    return [...assembleWords].sort(() => Math.random() - 0.5);
  }, [assembleWords]);
  const showNext =
    (variant !== "quiz" || selectedAnswerId !== null) &&
    (variant !== "fillGap" || gapChecked) &&
    (variant !== "assemble" || assembleChecked);

  useEffect(() => {
    if (totalGaps === 0) return;
    setGapSelections(Array(totalGaps).fill(""));
    setGapChecked(false);
  }, [totalGaps]);

  useEffect(() => {
    if (assembleWords.length === 0) return;
    setAssembleSelections(Array(assembleWords.length).fill(""));
    setAssembleChecked(false);
  }, [assembleWords.length]);

  useEffect(() => {
    if (activeIndex >= ordered.length && ordered.length > 0) {
      setActiveIndex(ordered.length - 1);
    }
  }, [activeIndex, ordered.length]);

  useEffect(() => {
    const node = sliderRef.current;
    if (!node || ordered.length <= 1) return;
    const handleScroll = () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = requestAnimationFrame(() => {
        const containerRect = node.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;
        let closestIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;
        cardRefs.current.forEach((card, index) => {
          if (!card) return;
          const rect = card.getBoundingClientRect();
          const center = rect.left + rect.width / 2;
          const distance = Math.abs(center - containerCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        setActiveIndex(closestIndex);
      });
    };
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [ordered.length]);

  if (!activeSnippet) {
    return (
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 22, textAlign: "center" }}>{title}</div>
        <div style={{ color: "var(--tg-subtle)", textAlign: "center" }}>{text}</div>
        <div style={{ color: "var(--tg-subtle)", textAlign: "center" }}>Сниппет не найден.</div>
        {showNext && (
          <button type="button" style={primaryButtonStyle} onClick={onNext}>
            Далее
          </button>
        )}
      </div>
    );
  }

  const description = activeSnippet.description;

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 700, fontSize: 22, textAlign: "center" }}>{title}</div>
      <div style={{ color: "var(--tg-subtle)", textAlign: "center" }}>{text}</div>

      <div style={{ display: "grid", gap: 12 }}>
        {ordered.length === 1 ? (
          <SnippetPlayer snippet={activeSnippet} />
        ) : (
          <div style={sliderStyle} ref={sliderRef}>
            {ordered.map((snippet, index) => (
              <div
                key={snippet.id ?? `${snippet.videoUrl}-${index}`}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                style={slideStyle}
              >
                <SnippetPlayer snippet={snippet} />
              </div>
            ))}
          </div>
        )}
        {description && (
          <div style={{ color: "var(--tg-subtle)", textAlign: "center" }}>
            {description}
          </div>
        )}
      </div>

      {ordered.length > 1 && (
        <div style={{ color: "var(--tg-subtle)", fontSize: 12, textAlign: "center" }}>
          {activeIndex + 1}/{ordered.length}
        </div>
      )}

      {variant === "quiz" && answers.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {answers.slice(0, 3).map((answer) => {
            const isSelected = selectedAnswerId === answer.id;
            const showResult = selectedAnswerId !== null;
            const isCorrect = answer.isCorrect;
            const borderColor = showResult
              ? isCorrect
                ? "rgba(46, 204, 113, 0.6)"
                : isSelected
                  ? "rgba(255, 107, 107, 0.6)"
                  : "var(--tg-border)"
              : "var(--tg-border)";
            const background = showResult
              ? isCorrect
                ? "rgba(46, 204, 113, 0.12)"
                : isSelected
                  ? "rgba(255, 107, 107, 0.12)"
                  : "var(--tg-card)"
              : "var(--tg-card)";

            return (
              <button
                key={answer.id}
                type="button"
                style={{
                  ...answerStyle,
                  borderColor,
                  background,
                }}
                onClick={() => {
                  if (selectedAnswerId) return;
                  setSelectedAnswerId(answer.id);
                  setAnsweredCorrect(answer.isCorrect);
                }}
              >
                {answer.text}
              </button>
            );
          })}
          {answeredCorrect !== null && (
            <div style={{ color: answeredCorrect ? "#2ecc71" : "#ff8a8a", textAlign: "center" }}>
              {answeredCorrect ? "Правильно" : "Неправильно"}
            </div>
          )}
        </div>
      )}

      {variant === "fillGap" && totalGaps > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          <style>
            {`@keyframes lessonGapShake { 
                0% { transform: translateX(0); } 
                25% { transform: translateX(-4px); } 
                50% { transform: translateX(4px); } 
                75% { transform: translateX(-4px); } 
                100% { transform: translateX(0); } 
              }`}
          </style>
          <div
            style={{
              textAlign: "center",
              lineHeight: 1.5,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
            }}
          >
            {gapSentenceParts.map((part, index) => {
              const isGap = index < totalGaps;
              if (!isGap)
                return (
                  <span key={`part-${index}`} style={{ display: "inline-flex" }}>
                    {part}
                  </span>
                );
              const word = gapSelections[index];
              const isFilled = Boolean(word);
              const isCorrect = gapCorrectWords[index] === word;
              const showResult = gapChecked && isFilled;
              const color = showResult
                ? isCorrect
                  ? "#2ecc71"
                  : "#ff8a8a"
                : "var(--tg-text)";
              const background = showResult
                ? isCorrect
                  ? "rgba(46, 204, 113, 0.18)"
                  : "rgba(255, 107, 107, 0.18)"
                : "rgba(255,255,255,0.08)";
              const borderColor = showResult
                ? isCorrect
                  ? "rgba(46, 204, 113, 0.6)"
                  : "rgba(255, 107, 107, 0.6)"
                : "rgba(255, 255, 255, 0.22)";

              return (
                <span
                  key={`gap-${index}`}
                  onClick={() => {
                    if (gapChecked) return;
                    setGapSelections((prev) => {
                      const next = [...prev];
                      next[index] = "";
                      return next;
                    });
                  }}
                  style={{
                    display: "inline-block",
                    minWidth: 60,
                    minHeight: 34,
                    lineHeight: "22px",
                    padding: "6px 10px",
                    margin: "0 4px",
                    borderRadius: 12,
                    border: `3px dashed ${borderColor}`,
                    background,
                    color,
                    cursor: gapChecked ? "default" : "pointer",
                    animation:
                      gapChecked && isFilled && !isCorrect
                        ? "lessonGapShake 0.3s ease"
                        : "none",
                  }}
                >
                  {word || ""}
                </span>
              );
            })}
            {gapSentenceParts.length === totalGaps && <span>.</span>}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {gapOptions
              .filter((option) => !gapSelections.includes(option))
              .map((option) => {
              return (
                <button
                  key={option}
                  type="button"
                  disabled={gapChecked}
                  style={{
                    ...answerStyle,
                    width: "auto",
                    opacity: gapChecked ? 0.5 : 1,
                    cursor: gapChecked ? "default" : "pointer",
                  }}
                  onClick={() => {
                    if (gapChecked) return;
                    setGapSelections((prev) => {
                      const next = [...prev];
                      const emptyIndex = next.findIndex((value) => !value);
                      if (emptyIndex === -1) return next;
                      next[emptyIndex] = option;
                      return next;
                    });
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {!gapChecked && (
            <button
              type="button"
              style={primaryButtonStyle}
              onClick={() => {
                const isComplete = gapSelections.every((word) => word);
                if (!isComplete) return;
                setGapChecked(true);
              }}
            >
              Проверить
            </button>
          )}
        </div>
      )}

      {variant === "assemble" && assembleWords.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          <style>
            {`@keyframes lessonGapShake { 
                0% { transform: translateX(0); } 
                25% { transform: translateX(-4px); } 
                50% { transform: translateX(4px); } 
                75% { transform: translateX(-4px); } 
                100% { transform: translateX(0); } 
              }`}
          </style>
          <div
            style={{
              textAlign: "center",
              lineHeight: 1.5,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
            }}
          >
            {assembleWords.map((_, index) => {
              const word = assembleSelections[index] ?? "";
              const isFilled = Boolean(word);
              const isCorrect = assembleWords[index] === word;
              const showResult = assembleChecked && isFilled;
              const color = showResult
                ? isCorrect
                  ? "#2ecc71"
                  : "#ff8a8a"
                : "var(--tg-text)";
              const background = showResult
                ? isCorrect
                  ? "rgba(46, 204, 113, 0.18)"
                  : "rgba(255, 107, 107, 0.18)"
                : "rgba(255,255,255,0.08)";
              const borderColor = showResult
                ? isCorrect
                  ? "rgba(46, 204, 113, 0.6)"
                  : "rgba(255, 107, 107, 0.6)"
                : "rgba(255, 255, 255, 0.22)";

              return (
                <span
                  key={`assemble-slot-${index}`}
                  onClick={() => {
                    if (assembleChecked) return;
                    setAssembleSelections((prev) => {
                      const next = [...prev];
                      next[index] = "";
                      return next;
                    });
                  }}
                  style={{
                    display: "inline-block",
                    minWidth: 60,
                    minHeight: 34,
                    lineHeight: "22px",
                    padding: "6px 10px",
                    margin: "0 4px",
                    borderRadius: 12,
                    border: `3px dashed ${borderColor}`,
                    background,
                    color,
                    cursor: assembleChecked ? "default" : "pointer",
                    animation:
                      assembleChecked && isFilled && !isCorrect
                        ? "lessonGapShake 0.3s ease"
                        : "none",
                  }}
                >
                  {word || ""}
                </span>
              );
            })}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {shuffledAssembleOptions
              .filter((option) => !assembleSelections.includes(option))
              .map((option, index) => {
              return (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  disabled={assembleChecked}
                  style={{
                    ...answerStyle,
                    width: "auto",
                    opacity: assembleChecked ? 0.5 : 1,
                    cursor: assembleChecked ? "default" : "pointer",
                  }}
                  onClick={() => {
                    if (assembleChecked) return;
                    setAssembleSelections((prev) => {
                      const next = [...prev];
                      const emptyIndex = next.findIndex((value) => !value);
                      if (emptyIndex === -1) return next;
                      next[emptyIndex] = option;
                      return next;
                    });
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {!assembleChecked && (
            <button
              type="button"
              style={primaryButtonStyle}
              onClick={() => {
                const isComplete = assembleSelections.every((word) => word);
                if (!isComplete) return;
                setAssembleChecked(true);
              }}
            >
              Проверить
            </button>
          )}
        </div>
      )}

      {showNext && (
        <button type="button" style={primaryButtonStyle} onClick={onNext}>
          Далее
        </button>
      )}
    </div>
  );
}

const cardStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  borderRadius: 16,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  padding: 16,
};

const sliderStyle: CSSProperties = {
  display: "grid",
  gridAutoFlow: "column",
  gridAutoColumns: "100%",
  gap: 12,
  overflowX: "auto",
  scrollSnapType: "x mandatory",
  scrollbarWidth: "none",
};

const slideStyle: CSSProperties = {
  scrollSnapAlign: "center",
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(76,196,255,0.4)",
  background: "rgba(76,196,255,0.2)",
  color: "var(--tg-text)",
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const answerStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  color: "var(--tg-text)",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 600,
  textAlign: "center",
};
