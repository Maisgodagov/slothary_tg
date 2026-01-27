import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import {
  learningPathApi,
  type LearningPathAdminLesson,
  type LearningPathAdminModule,
} from "../features/learning-path/api";
import { PageShell } from "../shared/ui/PageShell";

const TEXT = {
  adminOnly: "Доступно только для администратора.",
  title: "Learning Path",
  createModule: "Новый модуль",
  createLesson: "Новый урок",
  save: "Сохранить",
  cancel: "Отмена",
  remove: "Удалить",
  loading: "Загружаем...",
  empty: "Пока нет модулей.",
  moduleTitle: "Название модуля",
  moduleOrder: "Порядок",
  moduleActive: "Активен",
};

type ViewMode = "list" | "module";

export default function LearningPathAdminPage() {
  const auth = useAppSelector(selectAuth);
  const isAdmin = auth.profile?.role === "admin";
  const navigate = useNavigate();
  const [modules, setModules] = useState<LearningPathAdminModule[]>([]);
  const [lessons, setLessons] = useState<LearningPathAdminLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleOrder, setModuleOrder] = useState(1);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleActive, setModuleActive] = useState(true);

  const loadModules = () => {
    setLoading(true);
    learningPathApi.admin
      .listModules()
      .then((result) => setModules(result.modules))
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  };

  const loadLessons = (moduleId?: string | null) => {
    if (!moduleId) {
      setLessons([]);
      return;
    }
    learningPathApi.admin
      .listLessons(moduleId)
      .then((result) => setLessons(result.lessons))
      .catch(() => setLessons([]));
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadModules();
  }, [isAdmin]);

  useEffect(() => {
    loadLessons(selectedModuleId);
  }, [selectedModuleId]);

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? null,
    [modules, selectedModuleId]
  );

  const beginCreateModule = () => {
    setEditingModuleId("new");
    setModuleOrder(modules.length + 1);
    setModuleTitle("");
    setModuleActive(true);
  };

  const beginEditModule = (module: LearningPathAdminModule) => {
    setEditingModuleId(module.id);
    setModuleOrder(module.orderIndex);
    setModuleTitle(module.title || "");
    setModuleActive(module.isActive);
  };

  const saveModule = () => {
    const payload = {
      orderIndex: moduleOrder,
      title: moduleTitle.trim(),
      isActive: moduleActive,
    };
    const request =
      editingModuleId === "new"
        ? learningPathApi.admin.createModule(payload)
        : learningPathApi.admin.updateModule(editingModuleId as string, payload);

    request
      .then(() => {
        loadModules();
        setEditingModuleId(null);
      })
      .catch(() => null);
  };

  const removeModule = (id: string) => {
    learningPathApi.admin
      .deleteModule(id)
      .then(() => {
        setModules((prev) => prev.filter((module) => module.id !== id));
        if (selectedModuleId === id) {
          setSelectedModuleId(null);
          setViewMode("list");
        }
      })
      .catch(() => null);
  };

  const openModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setViewMode("module");
  };

  const beginCreateLesson = () => {
    if (!selectedModuleId) return;
    navigate(`/admin/learning-path/modules/${selectedModuleId}/lessons/new`);
  };

  const beginEditLesson = (lesson: LearningPathAdminLesson) => {
    navigate(`/admin/learning-path/modules/${lesson.moduleId}/lessons/${lesson.id}`);
  };

  const moveLesson = (lessonId: string, direction: "up" | "down") => {
    const sorted = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
    const index = sorted.findIndex((lesson) => lesson.id === lessonId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const current = sorted[index];
    const target = sorted[targetIndex];
    Promise.all([
      learningPathApi.admin.updateLesson(current.id, { orderIndex: target.orderIndex }),
      learningPathApi.admin.updateLesson(target.id, { orderIndex: current.orderIndex }),
    ])
      .then(() => loadLessons(selectedModuleId))
      .catch(() => null);
  };

  const removeLesson = (id: string) => {
    learningPathApi.admin
      .deleteLesson(id)
      .then(() => setLessons((prev) => prev.filter((lesson) => lesson.id !== id)))
      .catch(() => null);
  };

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={{ padding: 16, color: "var(--tg-subtle)" }}>{TEXT.adminOnly}</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={{ padding: 16, display: "grid", gap: 16, paddingBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>{TEXT.title}</div>
          {viewMode === "list" && (
            <button type="button" onClick={beginCreateModule} style={primaryButtonStyle}>
              {TEXT.createModule}
            </button>
          )}
        </div>

        {viewMode === "list" && (
          <section style={{ display: "grid", gap: 12 }}>
            {loading && <div style={{ color: "var(--tg-subtle)" }}>{TEXT.loading}</div>}

            {!loading && modules.length === 0 && (
              <div style={{ color: "var(--tg-subtle)" }}>{TEXT.empty}</div>
            )}

            {!loading && modules.length > 0 && (
              <div style={{ display: "grid", gap: 10 }}>
                {modules.map((module) => (
                  <div key={module.id} style={cardStyle}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 700 }}>{module.title || `Модуль ${module.orderIndex}`}</div>
                      <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                        Уроков: {module.lessonCount}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" style={primaryButtonStyle} onClick={() => openModule(module.id)}>
                        Открыть
                      </button>
                      <button type="button" style={ghostButtonStyle} onClick={() => beginEditModule(module)}>
                        Редактировать
                      </button>
                      <button type="button" style={dangerButtonStyle} onClick={() => removeModule(module.id)}>
                        {TEXT.remove}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingModuleId && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 600 }}>Настройки модуля</div>
                <label style={labelStyle}>
                  {TEXT.moduleOrder}
                  <input
                    type="number"
                    value={moduleOrder}
                    onChange={(event) => setModuleOrder(Number(event.target.value))}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  {TEXT.moduleTitle}
                  <input
                    value={moduleTitle}
                    onChange={(event) => setModuleTitle(event.target.value)}
                    style={inputStyle}
                  />
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={moduleActive}
                    onChange={(event) => setModuleActive(event.target.checked)}
                  />
                  {TEXT.moduleActive}
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" style={primaryButtonStyle} onClick={saveModule}>
                    {TEXT.save}
                  </button>
                  <button type="button" style={ghostButtonStyle} onClick={() => setEditingModuleId(null)}>
                    {TEXT.cancel}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {viewMode === "module" && selectedModule && (
          <section style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>{selectedModule.title}</div>
              <button type="button" onClick={beginCreateLesson} style={primaryButtonStyle}>
                {TEXT.createLesson}
              </button>
            </div>

            {lessons.length === 0 && <div style={{ color: "var(--tg-subtle)" }}>Пока нет уроков.</div>}

            {lessons.length > 0 && (
              <div style={{ display: "grid", gap: 10 }}>
                {lessons
                  .slice()
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((lesson) => (
                    <div key={lesson.id} style={cardStyle}>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontWeight: 700 }}>
                          Урок {lesson.orderIndex}: {lesson.phraseTextEn}
                        </div>
                        {lesson.phraseTextRu && (
                          <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>{lesson.phraseTextRu}</div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" style={ghostButtonStyle} onClick={() => moveLesson(lesson.id, "up")}>
                          ↑
                        </button>
                        <button type="button" style={ghostButtonStyle} onClick={() => moveLesson(lesson.id, "down")}>
                          ↓
                        </button>
                        <button type="button" style={ghostButtonStyle} onClick={() => beginEditLesson(lesson)}>
                          Редактировать
                        </button>
                        <button type="button" style={dangerButtonStyle} onClick={() => removeLesson(lesson.id)}>
                          {TEXT.remove}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}
      </div>
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

const checkboxStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  fontSize: 13,
  color: "var(--tg-text)",
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(76,196,255,0.4)",
  background: "rgba(76,196,255,0.2)",
  color: "var(--tg-text)",
  padding: "6px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const ghostButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--tg-border)",
  background: "transparent",
  color: "var(--tg-text)",
  padding: "6px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const dangerButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,107,107,0.4)",
  background: "rgba(255,107,107,0.1)",
  color: "#ff8a8a",
  padding: "6px 14px",
  cursor: "pointer",
  fontWeight: 600,
};
