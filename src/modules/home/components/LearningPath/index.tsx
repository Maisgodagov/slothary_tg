import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  learningPathApi,
  type LearningPathModuleSummary,
} from "../../../../features/learning-path/api";
import { useAppSelector } from "../../../../app/hooks";
import { selectAuth } from "../../../../features/auth/slice";

const TEXT = {
  title: "Путь",
  loading: "Загружаем путь...",
  empty: "Пока нет модулей для обучения.",
};

const FORCE_MOCK_PATH = true;

type MockLessonStatus = "LOCKED" | "OPEN" | "IN_PROGRESS" | "COMPLETED";

type MockLesson = {
  id: string;
  title: string;
  orderIndex: number;
  status: MockLessonStatus;
  coverUrl: string;
};

type MockModule = {
  id: string;
  title: string;
  orderIndex: number;
  lessons: MockLesson[];
};

const MOCK_MODULES: MockModule[] = [
  {
    id: "mock-1",
    title: "Основы",
    orderIndex: 1,
    lessons: [
      {
        id: "mock-1-1",
        title: "Привет",
        orderIndex: 1,
        status: "COMPLETED",
        coverUrl:
          "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-1-2",
        title: "Я и ты",
        orderIndex: 2,
        status: "COMPLETED",
        coverUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-1-3",
        title: "Давай повторим",
        orderIndex: 3,
        status: "IN_PROGRESS",
        coverUrl:
          "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-1-4",
        title: "Отличная идея!",
        orderIndex: 4,
        status: "OPEN",
        coverUrl:
          "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-1-5",
        title: "Спасибо",
        orderIndex: 5,
        status: "OPEN",
        coverUrl:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-1-6",
        title: "Пока!",
        orderIndex: 6,
        status: "OPEN",
        coverUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-1-7",
        title: "Кто ты?",
        orderIndex: 7,
        status: "OPEN",
        coverUrl:
          "https://images.unsplash.com/photo-1504593811423-6dd665756598?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-1-8",
        title: "Это мой друг",
        orderIndex: 8,
        status: "OPEN",
        coverUrl:
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-1-9",
        title: "Мини-история",
        orderIndex: 9,
        status: "OPEN",
        coverUrl:
          "https://images.unsplash.com/photo-1455885666463-4b8f7a0c4b36?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-1-10",
        title: "Проверь себя",
        orderIndex: 10,
        status: "OPEN",
        coverUrl:
          "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=300&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "mock-2",
    title: "Каждый день",
    orderIndex: 2,
    lessons: [
      {
        id: "mock-2-1",
        title: "Как дела?",
        orderIndex: 1,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-2-2",
        title: "Мой день",
        orderIndex: 2,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-2-3",
        title: "Вопросы",
        orderIndex: 3,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-2-4",
        title: "Практика",
        orderIndex: 4,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-2-5",
        title: "Мои планы",
        orderIndex: 5,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-2-6",
        title: "Где это?",
        orderIndex: 6,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-2-7",
        title: "Я могу",
        orderIndex: 7,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-2-8",
        title: "Повторение",
        orderIndex: 8,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=300&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "mock-3",
    title: "Путешествия",
    orderIndex: 3,
    lessons: [
      {
        id: "mock-3-1",
        title: "Аэропорт",
        orderIndex: 1,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-3-2",
        title: "Отель",
        orderIndex: 2,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-3-3",
        title: "Кафе",
        orderIndex: 3,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1445116572660-236099ec97a0?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-3-4",
        title: "Такси",
        orderIndex: 4,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-3-5",
        title: "Город",
        orderIndex: 5,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-3-6",
        title: "Покупки",
        orderIndex: 6,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "mock-3-7",
        title: "На память",
        orderIndex: 7,
        status: "LOCKED",
        coverUrl:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=300&auto=format&fit=crop",
      },
    ],
  },
];

export function LearningPathSection() {
  const auth = useAppSelector(selectAuth);
  const navigate = useNavigate();
  const [modules, setModules] = useState<LearningPathModuleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const isAdmin = auth.profile?.role === "admin";

  if (!isAdmin) {
    return null;
  }

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    learningPathApi
      .getPath(auth.profile?.id)
      .then((result) => setModules(result.modules))
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  }, [auth.profile?.id, isAdmin]);

  const visibleModules = useMemo(() => {
    if (!modules.length) return [];
    const currentIndex = modules.findIndex(
      (module) => module.status !== "COMPLETED",
    );
    const center = currentIndex === -1 ? modules.length - 1 : currentIndex;
    const start = Math.max(0, center - 1);
    const end = Math.min(modules.length - 1, center + 2);
    return modules.slice(start, end + 1);
  }, [modules]);

  const displayModules: MockModule[] =
    !FORCE_MOCK_PATH && isAdmin && visibleModules.length > 0
      ? visibleModules.map((module) => ({
          id: module.id,
          title: module.title || `Модуль ${module.orderIndex}`,
          orderIndex: module.orderIndex,
          lessons: module.lessons.map((lesson) => ({
            id: lesson.id,
            title: `Урок ${lesson.orderIndex}`,
            orderIndex: lesson.orderIndex,
            coverUrl:
              "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=300&auto=format&fit=crop",
            status:
              module.status === "LOCKED"
                ? "LOCKED"
                : lesson.status === "COMPLETED"
                  ? "COMPLETED"
                  : lesson.status === "IN_PROGRESS"
                    ? "IN_PROGRESS"
                    : "OPEN",
          })),
        }))
      : MOCK_MODULES;

  const showAdminEmptyState =
    !FORCE_MOCK_PATH && isAdmin && !loading && modules.length === 0;

  return (
    <section style={{ display: "grid", gap: 12, padding: "0 40px" }}>
      {loading && !FORCE_MOCK_PATH && (
        <div style={{ color: "var(--tg-subtle)" }}>{TEXT.loading}</div>
      )}
      {showAdminEmptyState && (
        <div style={{ color: "var(--tg-subtle)" }}>{TEXT.empty}</div>
      )}

      {(!loading || FORCE_MOCK_PATH) && displayModules.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {displayModules.map((module) => (
            <div
              key={module.id}
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                <div
                  style={{ fontWeight: 800, fontSize: 24, textAlign: "center" }}
                >
                  {module.title}
                </div>
                <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                  {
                    module.lessons.filter(
                      (lesson) => lesson.status === "COMPLETED",
                    ).length
                  }
                  /{module.lessons.length}
                </div>
              </div>
              <div style={{ display: "grid", gap: 0, padding: "0 12px" }}>
                {module.lessons.map((lesson, index) => {
                  const isLocked = lesson.status === "LOCKED";
                  const isCompleted = lesson.status === "COMPLETED";
                  const direction = index % 2 === 0 ? "left" : "right";
                  const showConnector = index < module.lessons.length - 1;

                  const chipBackground = isCompleted ? "#3F8F6B" : "#3B6F8E";

                  const shadow = isLocked
                    ? "none"
                    : "0 10px 22px rgba(0, 0, 0, 0.25)";

                  const connectorPadding =
                    direction === "left" ? "0 12% 0 24%" : "0 24% 0 12%";
                  const connectorPath =
                    direction === "left"
                      ? "M 8 8 H 142 Q 172 8 172 36 V 50"
                      : "M 192 8 H 58 Q 28 8 28 36 V 50";

                  return (
                    <div key={lesson.id} style={{ display: "grid", gap: 8 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            direction === "left" ? "flex-start" : "flex-end",
                        }}
                      >
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() =>
                            !isLocked && navigate(`/learn/lesson/${lesson.id}`)
                          }
                          style={{
                            width: 110,
                            display: "grid",
                            gap: 8,
                            justifyItems: "center",
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            cursor: isLocked ? "not-allowed" : "pointer",
                            opacity: isLocked ? 0.7 : 1,
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              width: 120,
                              height: 120,
                              borderRadius: 999,
                              padding: 0,
                              background: "transparent",
                              boxShadow: shadow,
                              transition: "transform 120ms ease",
                              transform: isLocked ? "none" : "translateZ(0)",
                              position: "relative",
                              overflow: "visible",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: 999,
                                overflow: "hidden",
                                background: "var(--tg-surface)",
                                position: "relative",
                              }}
                            >
                              <img
                                src={lesson.coverUrl}
                                alt={lesson.title}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  filter: isLocked
                                    ? "grayscale(0.2) saturate(0.8)"
                                    : "none",
                                  opacity: isLocked ? 0.85 : 1,
                                }}
                              />
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: 28,
                              padding: "2x 4px",
                              borderRadius: 999,
                              background: chipBackground,
                              fontSize: 16,
                              fontWeight: 500,
                              color: "var(--tg-text)",
                              width: "100%",
                              marginTop: -18,
                              position: "relative",
                              textWrap: "nowrap",
                              zIndex: 2,
                            }}
                          >
                            {lesson.title}
                          </div>

                          {isLocked && (
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                letterSpacing: 0.4,
                                color: "var(--tg-subtle)",
                              }}
                              aria-hidden
                            >
                              LOCK
                            </div>
                          )}
                        </button>
                      </div>

                      {showConnector && (
                        <div
                          style={{ padding: connectorPadding, marginTop: -28 }}
                        >
                          <svg
                            aria-hidden
                            viewBox="0 0 200 56"
                            width="100%"
                            height="56"
                            preserveAspectRatio="none"
                          >
                            <path
                              d={connectorPath}
                              fill="none"
                              stroke="rgba(206, 223, 255, 0.6)"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray="1 10"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
