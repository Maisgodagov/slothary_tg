import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import {
  dictionaryApi,
  type DictionaryStats,
  type DictionaryStatsWord,
} from "../features/dictionary/api";
import { WordCard } from "../features/dictionary/components/WordCard";
import { Icon } from "../shared/ui/Icon";
import { PageShell } from "../shared/ui/PageShell";
import {
  EmptyState,
  ListSection,
  ListTitle,
  LoadingState,
  PageWrap,
  ProgressFill,
  ProgressTrack,
  StatChip,
  StatusBadge,
  SummaryCard,
  SummaryHeader,
  SummaryTab,
  SummaryTabs,
  SummaryTitle,
  WordCardWrap,
  WordMeta,
  WordStatsRow,
  WordsList,
} from "./WordProgressPage.styles";

const STATS_PAGE_SIZE = 20;
const STATUSES = ["learning", "known", "viewed"] as const;
type StatsTab = (typeof STATUSES)[number];
type StatsWordWithStatus = DictionaryStatsWord & { status: StatsTab };

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
  const [statsTab, setStatsTab] = useState<StatsTab | null>(null);
  const [statsWords, setStatsWords] = useState<StatsWordWithStatus[]>([]);
  const [statsWordsLoading, setStatsWordsLoading] = useState(false);
  const [statsWordsHasMore, setStatsWordsHasMore] = useState(false);
  const [statsWordsOffset, setStatsWordsOffset] = useState(0);
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

  const fetchAllByStatus = useCallback(
    async (status: StatsTab) => {
      if (!auth.profile?.id) return [];
      const items: StatsWordWithStatus[] = [];
      let offset = 0;
      while (true) {
        const result = await dictionaryApi.getStatsWords(auth.profile.id, status, {
          limit: STATS_PAGE_SIZE,
          offset,
        });
        items.push(
          ...result.items.map((entry) => ({
            ...entry,
            status,
          }))
        );
        if (result.items.length < STATS_PAGE_SIZE) break;
        offset += result.items.length;
      }
      return items;
    },
    [auth.profile?.id]
  );

  const loadStatsWords = useCallback(
    async (tab: StatsTab | null) => {
      if (!auth.profile?.id) return;
      setStatsWordsLoading(true);
      setStatsWords([]);
      setStatsWordsHasMore(false);
      setStatsWordsOffset(0);
      try {
        if (!tab) {
          const results = await Promise.all(STATUSES.map(fetchAllByStatus));
          setStatsWords(results.flat());
          return;
        }
        const result = await dictionaryApi.getStatsWords(auth.profile.id, tab, {
          limit: STATS_PAGE_SIZE,
          offset: 0,
        });
        setStatsWords(
          result.items.map((entry) => ({
            ...entry,
            status: tab,
          }))
        );
        setStatsWordsHasMore(result.items.length >= STATS_PAGE_SIZE);
        setStatsWordsOffset(result.items.length);
      } catch {
        setStatsWords([]);
      } finally {
        setStatsWordsLoading(false);
      }
    },
    [auth.profile?.id, fetchAllByStatus]
  );

  const handleStatsTabClick = (tab: StatsTab) => {
    if (!auth.profile?.id) return;
    const nextTab = statsTab === tab ? null : tab;
    setStatsTab(nextTab);
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
        setStatsWords((prev) => [
          ...prev,
          ...result.items.map((entry) => ({
            ...entry,
            status: statsTab,
          })),
        ]);
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

  useEffect(() => {
    if (!auth.profile?.id) return;
    loadStatsWords(statsTab);
  }, [auth.profile?.id, loadStatsWords, statsTab]);

  if (auth.profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const getStatusLabel = (status: StatsTab) =>
    ({
      learning: "ИЗУЧАЮ",
      known: "ВЫУЧИЛ",
      viewed: "СМОТРЕЛ",
    }[status]);

  return (
    <PageShell>
      <PageWrap>
        <SummaryCard>
          <SummaryHeader>
            <SummaryTitle>Мой прогресс</SummaryTitle>
          </SummaryHeader>
          {statsLoading && <LoadingState>Загружаем статистику...</LoadingState>}
          {!statsLoading && wordStats && (
            <SummaryTabs>
              <SummaryTab
                type="button"
                $tone="learning"
                $active={statsTab === "learning"}
                onClick={() => handleStatsTabClick("learning")}
              >
                <Icon name="exercise" size={18} color="#5ab0ff" />
                <strong>{wordStats.learningCount}</strong>
                <span>Изучаю</span>
              </SummaryTab>
              <SummaryTab
                type="button"
                $tone="known"
                $active={statsTab === "known"}
                onClick={() => handleStatsTabClick("known")}
              >
                <Icon name="trophy" size={18} color="#f3c44a" />
                <strong>{wordStats.knownCount}</strong>
                <span>Выучено</span>
              </SummaryTab>
              <SummaryTab
                type="button"
                $tone="viewed"
                $active={statsTab === "viewed"}
                onClick={() => handleStatsTabClick("viewed")}
              >
                <Icon name="history" size={18} color="#5cd48a" />
                <strong>{wordStats.viewedCount}</strong>
                <span>Смотрел</span>
              </SummaryTab>
            </SummaryTabs>
          )}
        </SummaryCard>

        <ListSection>
          <ListTitle>Список слов</ListTitle>
          {statsWordsLoading && <LoadingState>Загружаем слова...</LoadingState>}
          {!statsWordsLoading && statsWords.length === 0 && (
            <EmptyState>Пока нет слов в этой категории.</EmptyState>
          )}
          {statsWords.length > 0 && (
            <WordsList>
              {statsWords.map((entry, index) => {
                const status = entry.status;
                const touchesTotal = entry.touchesTotal ?? 0;
                const correct = entry.touchesCorrect ?? 0;
                const incorrect = entry.touchesIncorrect ?? 0;
                const answered = correct + incorrect;
                const progressPercent =
                  answered > 0 ? Math.min(100, Math.round((correct / answered) * 100)) : 0;

                return (
                  <WordCardWrap key={`${entry.status}-${entry.id}-${index}`}>
                    <StatusBadge $tone={status}>{getStatusLabel(status)}</StatusBadge>
                    <WordCard
                      word={entry.word}
                      translation={entry.translation}
                      otherTranslationsRu={undefined}
                      showExamplesButton={false}
                      examplesOpen={false}
                      onToggleExamples={() => undefined}
                      dictionaryActionMode="none"
                      summary
                      variant="compact"
                    >
                      <WordMeta>
                        <span>Попадалось: {formatTimes(touchesTotal)}</span>
                        {touchesTotal === 0 ? (
                          <span>Начните изучение этого слова</span>
                        ) : (
                          <WordStatsRow>
                            <div style={{ display: "flex", gap: 12 }}>
                              <StatChip $tone="success">
                                Верно: {correct}
                              </StatChip>
                              <StatChip $tone="danger">
                                Неверно: {incorrect}
                              </StatChip>
                            </div>
                            <ProgressTrack>
                              <ProgressFill $tone={status} $percent={progressPercent} />
                            </ProgressTrack>
                          </WordStatsRow>
                        )}
                      </WordMeta>
                    </WordCard>
                  </WordCardWrap>
                );
              })}
            </WordsList>
          )}
          {statsTab && statsWordsHasMore && (
            <div ref={statsLoadMoreRef} style={{ height: 1, width: "100%" }} />
          )}
        </ListSection>
      </PageWrap>
    </PageShell>
  );
}
