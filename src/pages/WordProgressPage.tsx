import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import { dictionaryApi, type DictionaryStats, type DictionaryStatsWord } from "../features/dictionary/api";
import { WordCard } from "../features/dictionary/components/WordCard";
import { Icon } from "../shared/ui/Icon";
import { PageShell } from "../shared/ui/PageShell";

const STATS_PAGE_SIZE = 20;

const formatTimes = (value: number) => {
  const last = value % 10;
  const lastTwo = value % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return `${value} раз`;
  if (last === 1) return `${value} раз`;
  if (last >= 2 && last <= 4) return `${value} раза`;
  return `${value} раз`;
};

export default function WordProgressPage() {
  const auth = useAppSelector(selectAuth);
  const [wordStats, setWordStats] = useState<DictionaryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsTab, setStatsTab] = useState<
    "learning" | "known" | "viewed" | null
  >(null);
  const [statsWords, setStatsWords] = useState<DictionaryStatsWord[]>([]);
  const [statsWordsLoading, setStatsWordsLoading] = useState(false);
  const [statsWordsHasMore, setStatsWordsHasMore] = useState(false);
  const [statsWordsOffset, setStatsWordsOffset] = useState(0);
  const [expandedStatsWordId, setExpandedStatsWordId] = useState<string | null>(
    null
  );
  const statsLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const statsLoadMoreObserver = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!auth.profile?.id) return;
    setStatsLoading(true);
    dictionaryApi
      .getStats(auth.profile.id)
      .then((stats) => setWordStats(stats))
      .catch(() => setWordStats(null))
      .finally(() => setStatsLoading(false));
  }, [auth.profile?.id]);

  const handleStatsTabClick = (tab: "learning" | "known" | "viewed") => {
    if (!auth.profile?.id) return;
    if (statsTab === tab) {
      setStatsTab(null);
      setStatsWords([]);
      setExpandedStatsWordId(null);
      setStatsWordsHasMore(false);
      setStatsWordsOffset(0);
      return;
    }
    setStatsTab(tab);
    setStatsWords([]);
    setStatsWordsHasMore(false);
    setStatsWordsOffset(0);
    setExpandedStatsWordId(null);
    setStatsWordsLoading(true);
    dictionaryApi
      .getStatsWords(auth.profile.id, tab, {
        limit: STATS_PAGE_SIZE,
        offset: 0,
      })
      .then((result) => {
        setStatsWords(result.items);
        setStatsWordsHasMore(result.items.length >= STATS_PAGE_SIZE);
        setStatsWordsOffset(result.items.length);
      })
      .catch(() => setStatsWords([]))
      .finally(() => setStatsWordsLoading(false));
  };

  const loadMoreStatsWords = () => {
    if (!auth.profile?.id || !statsTab) return;
    if (statsWordsLoading || !statsWordsHasMore) return;
    setStatsWordsLoading(true);
    dictionaryApi
      .getStatsWords(auth.profile.id, statsTab, {
        limit: STATS_PAGE_SIZE,
        offset: statsWordsOffset,
      })
      .then((result) => {
        setStatsWords((prev) => [...prev, ...result.items]);
        setStatsWordsHasMore(result.items.length >= STATS_PAGE_SIZE);
        setStatsWordsOffset((prev) => prev + result.items.length);
      })
      .catch(() => null)
      .finally(() => setStatsWordsLoading(false));
  };

  useEffect(() => {
    if (!statsTab || !statsWordsHasMore) return;
    if (!statsLoadMoreRef.current) return;
    if (statsLoadMoreObserver.current) {
      statsLoadMoreObserver.current.disconnect();
    }
    statsLoadMoreObserver.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreStatsWords();
        }
      },
      { rootMargin: "200px" }
    );
    statsLoadMoreObserver.current.observe(statsLoadMoreRef.current);
    return () => {
      statsLoadMoreObserver.current?.disconnect();
    };
  }, [statsTab, statsWordsHasMore, statsWordsOffset]);

  if (auth.profile?.role !== "admin") {
    return <Navigate to="/" replace />;
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
        <div
          style={{
            borderRadius: 16,
            border: "1px solid var(--tg-border)",
            background: "var(--tg-card)",
            padding: 14,
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 18,
              textAlign: "center",
            }}
          >
            Мой прогресс
          </div>
          {statsLoading && (
            <div style={{ color: "var(--tg-subtle)", fontSize: 13 }}>
              Загружаем статистику...
            </div>
          )}
          {!statsLoading && wordStats && (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "nowrap",
                overflowX: "auto",
                paddingBottom: 4,
                WebkitOverflowScrolling: "touch",
              }}
            >
              <button
                type="button"
                onClick={() => handleStatsTabClick("learning")}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--tg-border)",
                  background:
                    statsTab === "learning"
                      ? "var(--tg-surface)"
                      : "transparent",
                  color: "var(--tg-text)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <Icon name="exercise" size={18} color="#4cc4ff" />
                Учу: {wordStats.learningCount}
              </button>
              <button
                type="button"
                onClick={() => handleStatsTabClick("known")}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--tg-border)",
                  background:
                    statsTab === "known"
                      ? "var(--tg-surface)"
                      : "transparent",
                  color: "var(--tg-text)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <Icon name="flame" size={18} color="#ff9f45" />
                Выучил: {wordStats.knownCount}
              </button>
              <button
                type="button"
                onClick={() => handleStatsTabClick("viewed")}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--tg-border)",
                  background:
                    statsTab === "viewed"
                      ? "var(--tg-surface)"
                      : "transparent",
                  color: "var(--tg-text)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <Icon name="history" size={18} color="var(--tg-subtle)" />
                Смотрел: {wordStats.viewedCount}
              </button>
            </div>
          )}
          {statsTab && statsWordsLoading && (
            <div style={{ color: "var(--tg-subtle)", fontSize: 13 }}>
              Загружаем слова...
            </div>
          )}
          {statsTab && !statsWordsLoading && statsWords.length === 0 && (
            <div style={{ color: "var(--tg-subtle)", fontSize: 13 }}>
              Пока нет слов.
            </div>
          )}
          {statsTab && statsWords.length > 0 && (
            <div
              style={{
                display: "grid",
                maxHeight: 280,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {statsWords.map((entry) => {
                const isExpanded = expandedStatsWordId === entry.id;
                return (
                  <div
                    key={`${statsTab}-${entry.id}`}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest("button")) {
                        return;
                      }
                      setExpandedStatsWordId((prev) =>
                        prev === entry.id ? null : entry.id
                      );
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <WordCard
                      word={entry.word}
                      translation={entry.translation}
                      otherTranslationsRu={
                        isExpanded ? entry.otherTranslations : undefined
                      }
                      showExamplesButton={false}
                      examplesOpen={false}
                      onToggleExamples={() => undefined}
                      dictionaryActionLabel="+ в словарь"
                      dictionaryActionMode="button"
                      dictionaryActionPlacement="inline"
                      dictionaryActionVisibility="expanded-only"
                      isExpanded={isExpanded}
                      layoutMode="tight"
                      onDictionaryAction={() => {
                        if (!auth.profile?.id) return;
                        dictionaryApi
                          .addUserDictionaryEntry(auth.profile.id, {
                            query: entry.query,
                            lang: entry.lang,
                            word: entry.word,
                            translation: entry.translation,
                          })
                          .catch(() => null);
                      }}
                      variant="compact"
                    >
                      {entry.touchesTotal !== null && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 14,
                            color: "var(--tg-subtle)",
                            gap: 8,
                            marginTop: isExpanded ? 6 : 0,
                          }}
                        >
                          <span>
                            попадалось {formatTimes(entry.touchesTotal)}
                          </span>
                          <span>
                            <span style={{ color: "var(--tg-success)" }}>
                              верно: {entry.touchesCorrect ?? 0}
                            </span>{" "}
                            ·{" "}
                            <span style={{ color: "var(--tg-danger)" }}>
                              неверно: {entry.touchesIncorrect ?? 0}
                            </span>
                          </span>
                        </div>
                      )}
                    </WordCard>
                  </div>
                );
              })}
            </div>
          )}
          {statsTab && statsWordsHasMore && (
            <div ref={statsLoadMoreRef} style={{ height: 1, width: "100%" }} />
          )}
        </div>
      </div>
    </PageShell>
  );
}
