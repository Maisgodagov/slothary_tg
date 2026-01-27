import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import {
  learningPathApi,
  type LearningPathAdminLesson,
  type LearningPathSnippet,
} from "../features/learning-path/api";
import { PageShell } from "../shared/ui/PageShell";
import { LessonStepCard } from "../shared/ui/LessonStepCard";
import { SnippetPlayer } from "../modules/audio-phrase-game/components/SnippetPlayer";

const TEXT = {
  adminOnly: "Доступно только для администратора.",
  addScreen: "Добавить экран",
  chooseType: "Выберите тип карточки",
  saveLesson: "Сохранить урок",
  saveScreen: "Сохранить экран",
  addSnippet: "Добавить сниппет",
  addMoreSnippet: "Добавить еще сниппет",
  edit: "Редактировать",
  remove: "Удалить",
  snippetSearch: "Поиск фраз в словаре",
  save: "Сохранить",
  cancel: "Отмена",
};

type ScreenType = "justWatch" | "quiz" | "fillGap" | "assemble";

type LessonScreen = {
  id: string;
  type: ScreenType;
  title: string;
  text: string;
  snippets: LearningPathSnippet[];
  quizOptions: string[];
  quizCorrectIndex: number;
  fillGapSentence: string;
  fillGapCorrect: string[];
  fillGapOptions: string[];
  assembleSentence: string;
};

const DEFAULT_TITLES: Record<ScreenType, string> = {
  justWatch: "Просто послушай",
  quiz: "Как это переводится?",
  fillGap: "Заполни пропуски",
  assemble: "Собери фразу",
};

const DEFAULT_TEXTS: Record<ScreenType, string> = {
  justWatch: "Прослушай фразу.",
  quiz: "Выбери правильный ответ.",
  fillGap: "Вставь пропущенные слова.",
  assemble: "Собери фразу по словам.",
};

export default function LearningPathLessonEditorPage() {
  const auth = useAppSelector(selectAuth);
  const isAdmin = auth.profile?.role === "admin";
  const navigate = useNavigate();
  const { moduleId, lessonId } = useParams();

  const [lessons, setLessons] = useState<LearningPathAdminLesson[]>([]);
  const [orderIndex, setOrderIndex] = useState(1);
  const [xpReward, setXpReward] = useState(25);
  const [lessonTitle, setLessonTitle] = useState("");

  const [screens, setScreens] = useState<LessonScreen[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const [snippetModalOpen, setSnippetModalOpen] = useState(false);
  const [snippetQuery, setSnippetQuery] = useState("");
  const [snippetResults, setSnippetResults] = useState<LearningPathSnippet[]>([]);
  const [resultsActiveIndex, setResultsActiveIndex] = useState(0);
  const [pendingSnippet, setPendingSnippet] = useState<LearningPathSnippet | null>(null);
  const [editingSnippetScreenId, setEditingSnippetScreenId] = useState<string | null>(null);
  const [editingSnippetIndex, setEditingSnippetIndex] = useState<number | null>(null);

  const activeScreen = screens[activeIndex] ?? null;

  useEffect(() => {
    if (!moduleId) return;
    learningPathApi.admin
      .listLessons(moduleId)
      .then((result) => {
        setLessons(result.lessons);
        if (lessonId === "new") {
          setOrderIndex(result.lessons.length + 1);
        } else {
          const found = result.lessons.find((lesson) => lesson.id === lessonId);
          if (found) setOrderIndex(found.orderIndex);
        }
      })
      .catch(() => setLessons([]));
  }, [moduleId, lessonId]);

  useEffect(() => {
    if (lessonId === "new") return;
    if (!lessonId) return;
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) return;
    setXpReward(lesson.xpReward ?? 25);
    setLessonTitle(lesson.phraseTextEn || "");
    if (screens.length === 0) {
      setScreens([
        {
          id: `screen-${Date.now()}`,
          type: "justWatch",
          title: DEFAULT_TITLES.justWatch,
          text: DEFAULT_TEXTS.justWatch,
          snippets: [lesson.mainSnippet, ...lesson.altSnippets].filter(Boolean),
          quizOptions: [],
          quizCorrectIndex: 0,
          fillGapSentence: "",
          fillGapCorrect: [],
          fillGapOptions: [],
          assembleSentence: "",
        },
      ]);
    }
  }, [lessonId, lessons, screens.length]);

  useEffect(() => {
    if (!snippetQuery.trim()) {
      setSnippetResults([]);
      setResultsActiveIndex(0);
      return;
    }
    const timeout = setTimeout(() => {
      learningPathApi.admin
        .searchSnippets(snippetQuery)
        .then((result) => {
          setSnippetResults(result.snippets);
          setResultsActiveIndex(0);
        })
        .catch(() => setSnippetResults([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [snippetQuery]);

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={{ padding: 16, color: "var(--tg-subtle)" }}>{TEXT.adminOnly}</div>
      </PageShell>
    );
  }

  const openSnippetModal = (screenId: string, index: number | null) => {
    setEditingSnippetScreenId(screenId);
    setEditingSnippetIndex(index);
    const screen = screens.find((item) => item.id === screenId);
    const existing = index !== null ? screen?.snippets[index] ?? null : null;
    setPendingSnippet(existing ? { ...existing } : null);
    setSnippetModalOpen(true);
  };

  const saveSnippetToScreen = () => {
    if (!editingSnippetScreenId || !pendingSnippet) return;
    setScreens((prev) =>
      prev.map((screen) => {
        if (screen.id !== editingSnippetScreenId) return screen;
        const updated = [...screen.snippets];
        if (editingSnippetIndex === null || editingSnippetIndex === undefined) {
          updated.push(pendingSnippet);
        } else {
          updated[editingSnippetIndex] = pendingSnippet;
        }
        return { ...screen, snippets: updated };
      })
    );
    setSnippetModalOpen(false);
    setPendingSnippet(null);
  };

  const createScreen = (type: ScreenType) => {
    const newScreen: LessonScreen = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      title: DEFAULT_TITLES[type],
      text: DEFAULT_TEXTS[type],
      snippets: [],
      quizOptions: ["", "", ""],
      quizCorrectIndex: 0,
      fillGapSentence: "",
      fillGapCorrect: [],
      fillGapOptions: [],
      assembleSentence: "",
    };
    setScreens((prev) => [...prev, newScreen]);
    setActiveIndex(screens.length);
    setShowTypePicker(false);
  };

  const updateScreen = (id: string, patch: Partial<LessonScreen>) => {
    setScreens((prev) => prev.map((screen) => (screen.id === id ? { ...screen, ...patch } : screen)));
  };

  const removeScreen = (id: string) => {
    setScreens((prev) => prev.filter((screen) => screen.id !== id));
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSaveLesson = async () => {
    if (!moduleId) return;
    const allSnippets = screens.flatMap((screen) => screen.snippets);
    if (allSnippets.length === 0) return;

    const titleSource = lessonTitle || screens[0]?.title || `Lesson ${orderIndex}`;
    const importSnippet = async (snippet: LearningPathSnippet) => {
      const result = await learningPathApi.admin.importSnippet({
        contentId: snippet.contentId,
        startSeconds: snippet.startSeconds,
        endSeconds: snippet.endSeconds,
        phrase: snippet.phrase,
        translation: snippet.translation ?? null,
      });
      return result.snippet;
    };

    const imported = await Promise.all(allSnippets.map(importSnippet));
    const main = imported[0];
    const alt = imported.slice(1, 3);

    const payload = {
      moduleId,
      orderIndex,
      phraseTextEn: titleSource,
      phraseTextRu: null,
      xpReward,
      mainSnippetId: main.id,
      altSnippetIds: alt.map((snippet) => snippet.id),
      targetWords: [],
    };

    if (lessonId === "new") {
      await learningPathApi.admin.createLesson(payload);
    } else if (lessonId) {
      await learningPathApi.admin.updateLesson(lessonId, payload);
    }

    navigate("/admin/learning-path");
  };

  return (
    <PageShell>
      <div style={{ padding: 16, display: "grid", gap: 16, paddingBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>{"Урок"}</div>
          <button
            type="button"
            style={xpButtonStyle}
            onClick={() => {
              const value = window.prompt("XP за урок", String(xpReward));
              if (!value) return;
              const parsed = Number(value);
              if (!Number.isNaN(parsed)) setXpReward(parsed);
            }}
          >
            XP: {xpReward}
          </button>
        </div>

        <button type="button" style={primaryButtonStyle} onClick={() => setShowTypePicker(true)}>
          {TEXT.addScreen}
        </button>

        {showTypePicker && (
          <div style={cardStyle}>
            <div style={{ fontWeight: 600 }}>{TEXT.chooseType}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button type="button" style={ghostButtonStyle} onClick={() => createScreen("justWatch")}>Just watch</button>
              <button type="button" style={ghostButtonStyle} onClick={() => createScreen("quiz")}>Quiz</button>
              <button type="button" style={ghostButtonStyle} onClick={() => createScreen("fillGap")}>Fill gap</button>
              <button type="button" style={ghostButtonStyle} onClick={() => createScreen("assemble")}>Assemble</button>
              <button type="button" style={ghostButtonStyle} onClick={() => setShowTypePicker(false)}>{TEXT.cancel}</button>
            </div>
          </div>
        )}

        {activeScreen && (
          <div style={{ display: "grid", gap: 12 }}>
            <LessonStepCard
              variant={activeScreen.type}
              title={activeScreen.title}
              text={activeScreen.text}
              snippets={activeScreen.snippets}
              answers={activeScreen.type === "quiz"
                ? activeScreen.quizOptions.map((option, index) => ({
                    id: `${activeScreen.id}-${index}`,
                    text: option,
                    isCorrect: index === activeScreen.quizCorrectIndex,
                  }))
                : undefined}
              gapSentenceParts={activeScreen.type === "fillGap"
                ? activeScreen.fillGapSentence.split("___")
                : undefined}
              gapCorrectWords={activeScreen.type === "fillGap" ? activeScreen.fillGapCorrect : undefined}
              gapOptions={activeScreen.type === "fillGap" ? activeScreen.fillGapOptions : undefined}
              assembleWords={activeScreen.type === "assemble"
                ? activeScreen.assembleSentence.split(" ").filter(Boolean)
                : undefined}
              onNext={() => null}
            />

            <div style={cardStyle}>
              <div style={{ display: "grid", gap: 8 }}>
                <label style={labelStyle}>
                  {"Заголовок ✎"}
                  <input
                    value={activeScreen.title}
                    onChange={(event) => updateScreen(activeScreen.id, { title: event.target.value })}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  {"Текст под заголовком ✎"}
                  <input
                    value={activeScreen.text}
                    onChange={(event) => updateScreen(activeScreen.id, { text: event.target.value })}
                    style={inputStyle}
                  />
                </label>

                {activeScreen.type === "quiz" && (
                  <div style={{ display: "grid", gap: 8 }}>
                    {activeScreen.quizOptions.map((option, index) => (
                      <label key={`${activeScreen.id}-opt-${index}`} style={labelStyle}>
                        {`Вариант ✎ ${index + 1}`}
                        <input
                          value={option}
                          onChange={(event) => {
                            const next = [...activeScreen.quizOptions];
                            next[index] = event.target.value;
                            updateScreen(activeScreen.id, { quizOptions: next });
                          }}
                          style={inputStyle}
                        />
                      </label>
                    ))}
                    <label style={labelStyle}>
                      {"Правильный ответ (1-3)"}
                      <input
                        type="number"
                        value={activeScreen.quizCorrectIndex + 1}
                        onChange={(event) => {
                          const value = Number(event.target.value) - 1;
                          updateScreen(activeScreen.id, { quizCorrectIndex: Math.max(0, Math.min(2, value)) });
                        }}
                        style={inputStyle}
                      />
                    </label>
                  </div>
                )}

                {activeScreen.type === "fillGap" && (
                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={labelStyle}>
                      {"Фраза с пропусками (___) ✎"}
                      <input
                        value={activeScreen.fillGapSentence}
                        onChange={(event) => updateScreen(activeScreen.id, { fillGapSentence: event.target.value })}
                        style={inputStyle}
                      />
                    </label>
                    <label style={labelStyle}>
                      {"Правильные слова (через запятую) ✎"}
                      <input
                        value={activeScreen.fillGapCorrect.join(", ")}
                        onChange={(event) =>
                          updateScreen(activeScreen.id, {
                            fillGapCorrect: event.target.value
                              .split(",")
                              .map((word) => word.trim())
                              .filter(Boolean),
                          })
                        }
                        style={inputStyle}
                      />
                    </label>
                    <label style={labelStyle}>
                      {"Варианты слова (через запятую) ✎"}
                      <input
                        value={activeScreen.fillGapOptions.join(", ")}
                        onChange={(event) =>
                          updateScreen(activeScreen.id, {
                            fillGapOptions: event.target.value
                              .split(",")
                              .map((word) => word.trim())
                              .filter(Boolean),
                          })
                        }
                        style={inputStyle}
                      />
                    </label>
                  </div>
                )}

                {activeScreen.type === "assemble" && (
                  <label style={labelStyle}>
                    {"Фраза для сборки ✎"}
                    <input
                      value={activeScreen.assembleSentence}
                      onChange={(event) => updateScreen(activeScreen.id, { assembleSentence: event.target.value })}
                      style={inputStyle}
                    />
                  </label>
                )}

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontWeight: 600 }}>{TEXT.addSnippet}</div>
                  {activeScreen.snippets.length === 0 && (
                    <button type="button" style={ghostButtonStyle} onClick={() => openSnippetModal(activeScreen.id, null)}>
                      {TEXT.addSnippet}
                    </button>
                  )}
                  {activeScreen.snippets.map((snippet, index) => (
                    <div key={`${snippet.id}-${index}`} style={snippetCardStyle}>
                      <SnippetPlayer snippet={snippet} />
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" style={ghostButtonStyle} onClick={() => openSnippetModal(activeScreen.id, index)}>
                          {TEXT.edit}
                        </button>
                        <button
                          type="button"
                          style={dangerButtonStyle}
                          onClick={() => updateScreen(activeScreen.id, { snippets: activeScreen.snippets.filter((_, idx) => idx !== index) })}
                        >
                          {TEXT.remove}
                        </button>
                      </div>
                    </div>
                  ))}
                  {activeScreen.snippets.length > 0 && (
                    <button type="button" style={ghostButtonStyle} onClick={() => openSnippetModal(activeScreen.id, null)}>
                      {TEXT.addMoreSnippet}
                    </button>
                  )}
                </div>

                <button type="button" style={primaryButtonStyle} onClick={() => null}>
                  {TEXT.saveScreen}
                </button>
              </div>
            </div>

            <button type="button" style={dangerButtonStyle} onClick={() => removeScreen(activeScreen.id)}>
              {"Удалить экран"}
            </button>
          </div>
        )}

        <div style={screenIndicatorStyle}>
          {screens.map((screen, index) => (
            <button
              key={screen.id}
              type="button"
              style={{
                ...indicatorItemStyle,
                background: index === activeIndex ? "rgba(76,196,255,0.4)" : "var(--tg-card)",
              }}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>

        <button type="button" style={primaryButtonStyle} onClick={handleSaveLesson}>
          {TEXT.saveLesson}
        </button>
      </div>

      {snippetModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={{ fontWeight: 700 }}>{TEXT.snippetSearch}</div>
            <input
              value={snippetQuery}
              onChange={(event) => setSnippetQuery(event.target.value)}
              style={inputStyle}
            />
            {snippetResults.length > 0 && (
              <div style={resultsSliderStyle}>
                {snippetResults[resultsActiveIndex] && (
                  <div style={snippetCardStyle}>
                    <SnippetPlayer snippet={snippetResults[resultsActiveIndex]} />
                    <div style={{ fontWeight: 600 }}>{snippetResults[resultsActiveIndex].phrase}</div>
                    <button type="button" style={ghostButtonStyle} onClick={() => setPendingSnippet({ ...snippetResults[resultsActiveIndex] })}>
                      {"Выбрать"}
                    </button>
                  </div>
                )}
              </div>
            )}
            {snippetResults.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                <button type="button" style={ghostButtonStyle} onClick={() => setResultsActiveIndex((prev) => Math.max(0, prev - 1))} disabled={resultsActiveIndex <= 0}>
                  {"Пред."}
                </button>
                <button type="button" style={ghostButtonStyle} onClick={() => setResultsActiveIndex((prev) => Math.min(snippetResults.length - 1, prev + 1))} disabled={resultsActiveIndex >= snippetResults.length - 1}>
                  {"След."}
                </button>
              </div>
            )}

            {pendingSnippet && (
              <div style={{ display: "grid", gap: 8 }}>
                <label style={labelStyle}>
                  Start
                  <input
                    type="number"
                    step="0.1"
                    value={pendingSnippet.startSeconds}
                    onChange={(event) => setPendingSnippet((prev) => (prev ? { ...prev, startSeconds: Number(event.target.value) } : prev))}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  End
                  <input
                    type="number"
                    step="0.1"
                    value={pendingSnippet.endSeconds}
                    onChange={(event) => setPendingSnippet((prev) => (prev ? { ...prev, endSeconds: Number(event.target.value) } : prev))}
                    style={inputStyle}
                  />
                </label>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={primaryButtonStyle} onClick={saveSnippetToScreen}>
                {TEXT.save}
              </button>
              <button type="button" style={ghostButtonStyle} onClick={() => setSnippetModalOpen(false)}>
                {TEXT.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

const cardStyle: CSSProperties = {
  borderRadius: 16,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  padding: 14,
  display: "grid",
  gap: 12,
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(76,196,255,0.4)",
  background: "rgba(76,196,255,0.2)",
  color: "var(--tg-text)",
  padding: "8px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const ghostButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--tg-border)",
  background: "transparent",
  color: "var(--tg-text)",
  padding: "8px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const dangerButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,107,107,0.4)",
  background: "rgba(255,107,107,0.1)",
  color: "#ff8a8a",
  padding: "8px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const xpButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(76,196,255,0.4)",
  background: "rgba(76,196,255,0.2)",
  color: "var(--tg-text)",
  padding: "6px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-surface)",
  color: "var(--tg-text)",
  padding: "8px 10px",
  fontSize: 14,
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 12,
  color: "var(--tg-subtle)",
};

const screenIndicatorStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  justifyContent: "center",
  flexWrap: "wrap",
};

const indicatorItemStyle: CSSProperties = {
  width: 28,
  height: 10,
  borderRadius: 6,
  border: "1px solid var(--tg-border)",
  padding: 0,
  cursor: "pointer",
};

const snippetCardStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-surface)",
  color: "var(--tg-text)",
  padding: "10px 12px",
  display: "grid",
  gap: 8,
};

const resultsSliderStyle: CSSProperties = {
  display: "grid",
  gridAutoFlow: "column",
  gridAutoColumns: "100%",
  gap: 12,
  overflow: "hidden",
  scrollSnapType: "x mandatory",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "grid",
  placeItems: "center",
  zIndex: 50,
  padding: 16,
};

const modalStyle: CSSProperties = {
  width: "min(420px, 100%)",
  borderRadius: 16,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  padding: 16,
  display: "grid",
  gap: 12,
};
