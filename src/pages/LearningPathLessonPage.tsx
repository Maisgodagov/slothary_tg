import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageShell } from "../shared/ui/PageShell";
import { PageShellContent } from "../shared/ui/PageShellContent";
import { SnippetPlayer } from "../modules/audio-phrase-game/components/SnippetPlayer";
import { LessonStepCard } from "../shared/ui/LessonStepCard";
import { learningPathApi, type LearningPathLessonDetail } from "../features/learning-path/api";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAuth, setProfile } from "../features/auth/slice";
import { dictionaryApi } from "../features/dictionary/api";
import { exercisesApi } from "../features/exercises/api";
import { wordIdsFromSubtitles } from "../features/exercises/lib/wordIds";

const TEXT = {
  start: "Начать",
  next: "Далее",
  replay: "Повторить",
  listen: "Просто послушай",
  assemble: "Собери фразу",
  translation: "Выбери перевод",
  fill: "Вставь пропущенное",
  context: "Другой контекст",
  reward: "Урок пройден",
  addWords: "Добавить слова в словарь?",
  added: "Добавлено",
  add: "Добавить",
  repeat: "Повторить урок",
};

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const normalizePhrase = (value: string) =>
  value.replace(/[,.!?]/g, "").trim();

export default function LearningPathLessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const [lesson, setLesson] = useState<LearningPathLessonDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [assembleSlots, setAssembleSlots] = useState<(string | null)[]>([]);
  const [assembleWords, setAssembleWords] = useState<string[]>([]);
  const [assembleMessage, setAssembleMessage] = useState<string | null>(null);
  const [assembleCorrect, setAssembleCorrect] = useState<boolean | null>(null);
  const [showWordBank, setShowWordBank] = useState(false);
  const [translationOptions, setTranslationOptions] = useState<string[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null);
  const [translationCorrect, setTranslationCorrect] = useState<boolean | null>(null);
  const [fillOptions, setFillOptions] = useState<string[]>([]);
  const [fillAnswer, setFillAnswer] = useState<string | null>(null);
  const [contextAnswer, setContextAnswer] = useState<boolean | null>(null);
  const [awardedXp, setAwardedXp] = useState(0);
  const [addedWords, setAddedWords] = useState<Record<string, boolean>>({});
  const completionRequested = useRef(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    learningPathApi
      .getLesson(id, auth.profile?.id)
      .then((result) => {
        setLesson(result.lesson);
        const lastStep = result.lesson.progress?.lastStepIndex ?? 0;
        setStepIndex(Math.max(0, Math.min(lastStep, 6)));
      })
      .catch(() => setLesson(null))
      .finally(() => setLoading(false));
  }, [auth.profile?.id, id]);

  const phraseWords = useMemo(() => {
    if (!lesson) return [];
    return normalizePhrase(lesson.phraseTextEn)
      .split(/\s+/)
      .filter(Boolean);
  }, [lesson]);

  const targetWord = useMemo(() => {
    if (!lesson) return null;
    return lesson.targetWords[0] || phraseWords.find((word) => word.length > 2) || phraseWords[0] || null;
  }, [lesson, phraseWords]);

  useEffect(() => {
    if (!lesson) return;
    setAssembleSlots(phraseWords.map(() => null));
    setAssembleWords(shuffle(phraseWords));
    setAssembleMessage(null);
    setAssembleCorrect(null);
  }, [lesson, phraseWords]);

  useEffect(() => {
    if (stepIndex === 2) {
      setShowWordBank(false);
      const timer = setTimeout(() => setShowWordBank(true), 800);
      return () => clearTimeout(timer);
    }
    setShowWordBank(false);
  }, [stepIndex]);

  useEffect(() => {
    if (!lesson) return;
    const options = [
      lesson.phraseTextRu,
      lesson.mainSnippet?.translation,
      ...lesson.altSnippets.map((snippet) => snippet.translation),
    ]
      .filter((value): value is string => Boolean(value))
      .filter((value, index, arr) => arr.indexOf(value) === index);

    while (options.length < 3) {
      options.push(`Вариант ${options.length + 1}`);
    }

    setTranslationOptions(shuffle(options).slice(0, 4));
    setSelectedTranslation(null);
    setTranslationCorrect(null);
  }, [lesson]);

  useEffect(() => {
    if (!targetWord || !lesson) return;
    const pool = phraseWords.filter((word) => word !== targetWord);
    const options = shuffle([targetWord, ...pool]).slice(0, 3);
    if (!options.includes(targetWord)) {
      options[0] = targetWord;
    }
    setFillOptions(shuffle(options));
    setFillAnswer(null);
  }, [lesson, phraseWords, targetWord]);

  useEffect(() => {
    if (!lesson || !id) return;
    if (stepIndex === 0) return;
    learningPathApi.stepLesson(id, auth.profile?.id, stepIndex).catch(() => null);
  }, [auth.profile?.id, id, lesson, stepIndex]);

  useEffect(() => {
    if (stepIndex === 0) {
      completionRequested.current = false;
    }
  }, [stepIndex]);

  const handleStart = () => {
    if (!id) return;
    learningPathApi.startLesson(id, auth.profile?.id, 0).catch(() => null);
    setStepIndex(1);
  };

  const handleCheckAssemble = () => {
    const answer = assembleSlots.join(" ").trim().toLowerCase();
    const target = phraseWords.join(" ").trim().toLowerCase();
    const correct = answer === target;
    setAssembleCorrect(correct);
    setAssembleMessage(correct ? "Верно!" : `Правильный порядок: ${phraseWords.join(" ")}`);
  };

  const handleTranslationPick = (value: string) => {
    if (!lesson) return;
    setSelectedTranslation(value);
    const correct = !lesson.phraseTextRu || value === lesson.phraseTextRu;
    setTranslationCorrect(correct);
  };

  const handleFillPick = async (value: string) => {
    if (!targetWord) return;
    setFillAnswer(value);
    const isCorrect = value === targetWord;
    if (!auth.profile?.id) return;
    const ids = await wordIdsFromSubtitles([targetWord]);
    const wordId = ids[0];
    if (wordId) {
      exercisesApi.submitAnswer({ wordId, isCorrect }, auth.profile.id).catch(() => null);
    }
  };

  const handleComplete = async () => {
    if (!lesson || !id || completionRequested.current) return;
    completionRequested.current = true;
    const result = await learningPathApi
      .completeLesson(id, auth.profile?.id, 6)
      .catch(() => null);
    const xp = result?.awardedXp ?? 0;
    setAwardedXp(xp);
    if (auth.profile && xp > 0) {
      dispatch(setProfile({ ...auth.profile, xpPoints: auth.profile.xpPoints + xp }));
    }
  };

  useEffect(() => {
    if (stepIndex === 6) {
      handleComplete().catch(() => null);
    }
  }, [stepIndex]);

  if (loading) {
    return (
      <PageShell>
        <div style={{ padding: 16, color: "var(--tg-subtle)" }}>Загружаем урок...</div>
      </PageShell>
    );
  }

  if (!lesson) {
    return (
      <PageShell>
        <div style={{ padding: 16, color: "var(--tg-subtle)" }}>Урок не найден.</div>
      </PageShell>
    );
  }

  const phraseWithBlank = targetWord
    ? lesson.phraseTextEn.replace(new RegExp(`\\b${targetWord}\\b`, "i"), "____")
    : lesson.phraseTextEn;

  return (
    <PageShell pullToRefresh={false} scroll={false} padding={false}>
      <PageShellContent>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, flex: 1 }}>
          {stepIndex === 0 && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ color: "var(--tg-subtle)" }}>{lesson.module.title}</div>
              <div style={{ fontWeight: 700, fontSize: 22 }}>{lesson.phraseTextEn}</div>
              <div style={{ color: "var(--tg-subtle)" }}>1 фраза · 3 минуты · видео</div>
              <button type="button" onClick={handleStart} style={primaryButtonStyle}>
                {TEXT.start}
              </button>
            </div>
          )}

          {stepIndex === 1 && (
            <LessonStepCard
              title={TEXT.listen}
              text={lesson.phraseTextEn}
              snippets={[
                {
                  ...lesson.mainSnippet,
                  description: lesson.phraseTextRu ?? null,
                },
              ]}
              onNext={() => setStepIndex(2)}
            />
          )}

          {stepIndex === 2 && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 600 }}>{TEXT.assemble}</div>
              <SnippetPlayer snippet={lesson.mainSnippet} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {assembleSlots.map((slot, idx) => (
                  <button
                    key={`${slot ?? "slot"}-${idx}`}
                    type="button"
                    style={{ ...slotStyle, opacity: slot ? 1 : 0.5 }}
                    onClick={() => {
                      if (!slot) return;
                      setAssembleSlots((prev) => {
                        const next = [...prev];
                        next[idx] = null;
                        return next;
                      });
                      setAssembleWords((prev) => [...prev, slot]);
                    }}
                  >
                    {slot ?? "___"}
                  </button>
                ))}
              </div>
              {showWordBank && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {assembleWords.map((word) => (
                    <button
                      key={word}
                      type="button"
                      style={chipStyle}
                      onClick={() => {
                        const emptyIndex = assembleSlots.findIndex((slot) => !slot);
                        if (emptyIndex === -1) return;
                        setAssembleSlots((prev) => {
                          const next = [...prev];
                          next[emptyIndex] = word;
                          return next;
                        });
                        setAssembleWords((prev) => prev.filter((item) => item !== word));
                      }}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              )}
              {assembleMessage && (
                <div style={{ color: assembleCorrect ? "#2ecc71" : "#ff8a8a" }}>
                  {assembleMessage}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={ghostButtonStyle}
                  onClick={() => {
                    setAssembleSlots(phraseWords.map(() => null));
                    setAssembleWords(shuffle(phraseWords));
                    setAssembleMessage(null);
                    setAssembleCorrect(null);
                  }}
                >
                  Reset
                </button>
                <button type="button" style={primaryButtonStyle} onClick={handleCheckAssemble}>
                  Проверить
                </button>
                {assembleCorrect && (
                  <button type="button" style={primaryButtonStyle} onClick={() => setStepIndex(3)}>
                    {TEXT.next}
                  </button>
                )}
              </div>
            </div>
          )}

          {stepIndex === 3 && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 600 }}>{TEXT.translation}</div>
              <SnippetPlayer snippet={lesson.mainSnippet} />
              <div style={{ display: "grid", gap: 8 }}>
                {translationOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    style={{
                      ...chipStyle,
                      borderColor: selectedTranslation === option ? "rgba(76, 196, 255, 0.6)" : "var(--tg-border)",
                    }}
                    onClick={() => handleTranslationPick(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {translationCorrect !== null && (
                <div style={{ color: translationCorrect ? "#2ecc71" : "#ff8a8a" }}>
                  {translationCorrect ? "Верно!" : `Правильно: ${lesson.phraseTextRu ?? ""}`}
                </div>
              )}
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() => setStepIndex(4)}
                disabled={lesson.phraseTextRu ? translationCorrect !== true : false}
              >
                {TEXT.next}
              </button>
            </div>
          )}

          {stepIndex === 4 && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 600 }}>{TEXT.fill}</div>
              <div style={{ fontSize: 18 }}>{phraseWithBlank}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {fillOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    style={{
                      ...chipStyle,
                      borderColor: fillAnswer === option ? "rgba(76, 196, 255, 0.6)" : "var(--tg-border)",
                    }}
                    onClick={() => handleFillPick(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {fillAnswer && (
                <div style={{ color: fillAnswer === targetWord ? "#2ecc71" : "#ff8a8a" }}>
                  {fillAnswer === targetWord ? "Верно!" : `Правильный ответ: ${targetWord}`}
                </div>
              )}
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() => setStepIndex(5)}
                disabled={targetWord ? fillAnswer !== targetWord : false}
              >
                {TEXT.next}
              </button>
            </div>
          )}

          {stepIndex === 5 && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 600 }}>{TEXT.context}</div>
              {lesson.altSnippets[0] ? (
                <SnippetPlayer snippet={lesson.altSnippets[0]} />
              ) : (
                <div style={{ color: "var(--tg-subtle)" }}>Нет дополнительного сниппета.</div>
              )}
              <div>Тот же смысл?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={chipStyle}
                  onClick={() => setContextAnswer(true)}
                >
                  Да
                </button>
                <button
                  type="button"
                  style={chipStyle}
                  onClick={() => setContextAnswer(false)}
                >
                  Нет
                </button>
              </div>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() => setStepIndex(6)}
                disabled={contextAnswer === null}
              >
                {TEXT.next}
              </button>
            </div>
          )}

          {stepIndex === 6 && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{TEXT.reward}</div>
              <div style={{ color: "var(--tg-subtle)" }}>XP +{awardedXp || lesson.xpReward}</div>
              <div style={{ color: "var(--tg-subtle)" }}>
                Прогресс модуля: {lesson.module.orderIndex} · Урок {lesson.orderIndex}
              </div>

              {lesson.targetWords.length > 0 && (
                <div style={{ display: "grid", gap: 8 }}>
                  <div>{TEXT.addWords}</div>
                  {lesson.targetWords.map((word) => (
                    <button
                      key={word}
                      type="button"
                      style={chipStyle}
                      onClick={() => {
                        if (!auth.profile?.id || addedWords[word]) return;
                        dictionaryApi
                          .addUserDictionaryEntry(auth.profile.id, {
                            query: word,
                            lang: "en",
                          })
                          .then(() =>
                            setAddedWords((prev) => ({ ...prev, [word]: true }))
                          )
                          .catch(() => null);
                      }}
                    >
                      {addedWords[word] ? `${TEXT.added}: ${word}` : `${TEXT.add}: ${word}`}
                    </button>
                  ))}
                </div>
              )}

              <button type="button" style={primaryButtonStyle} onClick={() => navigate("/")}> 
                {TEXT.next}
              </button>
              <button type="button" style={ghostButtonStyle} onClick={() => setStepIndex(0)}>
                {TEXT.repeat}
              </button>
            </div>
          )}
        </div>
      </PageShellContent>
    </PageShell>
  );
}

const primaryButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(76,196,255,0.4)",
  background: "rgba(76,196,255,0.2)",
  color: "var(--tg-text)",
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const ghostButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--tg-border)",
  background: "transparent",
  color: "var(--tg-text)",
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const chipStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  color: "var(--tg-text)",
  padding: "8px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const slotStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px dashed var(--tg-border)",
  background: "transparent",
  color: "var(--tg-text)",
  padding: "8px 14px",
  cursor: "pointer",
  fontWeight: 600,
};
