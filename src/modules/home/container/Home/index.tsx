import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { selectAuth } from "../../../../features/auth/slice";
import { getLevelInfo } from "../../../../shared/lib/xp";
import { Icon } from "../../../../shared/ui/Icon";
import { PageShell } from "../../../../shared/ui/PageShell";
import { homeApi } from "../../api";
import type { DictionaryStats } from "../../api/types";
import { AdminActionCard } from "../../components/AdminActionCard";
import { HomeHeader } from "../../components/HomeHeader";
import { StreakModal } from "../../components/StreakModal";
import { setLastStatsUpdatedAt } from "../../store/slice";
import {
  HomeWrapper,
  ProgressCard,
  ProgressDivider,
  ProgressGrid,
  ProgressHeader,
  ProgressItem,
  ProgressLabel,
  ProgressLink,
  ProgressMuted,
  ProgressSection,
  ProgressTitle,
  ProgressValue,
} from "./styles";

export function HomeContainer() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [wordStats, setWordStats] = useState<DictionaryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const initial = useMemo(() => {
    const raw = auth.profile?.fullName?.[0] ?? auth.profile?.email?.[0] ?? "U";
    return raw.toUpperCase();
  }, [auth.profile?.email, auth.profile?.fullName]);

  const displayName =
    auth.profile?.fullName ||
    auth.profile?.email ||
    (auth.profile as any)?.username ||
    "Профиль";

  const streakDays = auth.profile?.streakDays ?? 0;
  const xpPoints = auth.profile?.xpPoints ?? 0;
  const levelInfo = getLevelInfo(xpPoints);
  const avatarUrl =
    auth.profile?.avatarUrl ||
    (auth.profile as any)?.avatar ||
    (auth.profile as any)?.photoUrl ||
    (auth.profile as any)?.image ||
    (auth.profile as any)?.picture ||
    null;

  useEffect(() => {
    if (!auth.profile?.id) return;
    setStatsLoading(true);
    homeApi
      .getDictionaryStats(auth.profile.id)
      .then((stats) => {
        setWordStats(stats);
        dispatch(setLastStatsUpdatedAt(new Date().toISOString()));
      })
      .catch(() => setWordStats(null))
      .finally(() => setStatsLoading(false));
  }, [auth.profile?.id, dispatch]);

  const getStreakMessage = (days: number) => {
    if (days <= 0) {
      return "Похоже, это ваш первый день. Отличный старт!";
    }
    if (days == 1) {
      return "Вы заходили в приложение 1 день подряд. Так держать!";
    }
    if (days <= 3) {
      return `Вы заходили в приложение ${days} дня подряд. Хороший темп, продолжайте!`;
    }
    if (days <= 6) {
      return `Уже ${days} дней подряд! Отличная дисциплина - не сбавляйте обороты.`;
    }
    if (days <= 13) {
      return `Круто! ${days} дней подряд - это стабильность и прогресс.`;
    }
    if (days <= 29) {
      return `Вау! ${days} дней подряд. Очень сильная серия, продолжайте в том же духе.`;
    }
    return `Невероятно! ${days} дней подряд. Вы мощно прокачали привычку.`;
  };

  return (
    <PageShell>
      <HomeWrapper>
        <HomeHeader
          streakDays={streakDays}
          levelLabel={levelInfo.level}
          xpPoints={xpPoints}
          avatarUrl={avatarUrl}
          displayName={displayName}
          initial={initial}
          onOpenStreak={() => setShowStreakModal(true)}
          onOpenProfile={() => navigate("/profile")}
        />

        <StreakModal
          open={showStreakModal}
          message={getStreakMessage(streakDays)}
          onClose={() => setShowStreakModal(false)}
        />

        {wordStats && (
          <ProgressSection>
            <ProgressHeader>
              <ProgressTitle>Мой прогресс</ProgressTitle>
              {auth.profile?.role === "admin" && (
                <ProgressLink
                  type="button"
                  onClick={() => navigate("/admin/word-progress")}
                >
                  Детали
                </ProgressLink>
              )}
            </ProgressHeader>
            <ProgressCard>
              {statsLoading && (
                <ProgressMuted>Загружаем статистику...</ProgressMuted>
              )}
              {!statsLoading && (
                <ProgressGrid>
                  <ProgressItem>
                    <Icon name="exercise" size={24} color="#4da3ff" />
                    <ProgressValue>{wordStats.learningCount}</ProgressValue>
                    <ProgressLabel>ИЗУЧАЮ</ProgressLabel>
                  </ProgressItem>
                  <ProgressDivider />
                  <ProgressItem>
                    <Icon name="trophy" size={24} color="#2ecc71" />
                    <ProgressValue>{wordStats.knownCount}</ProgressValue>
                    <ProgressLabel>ВЫУЧЕНО</ProgressLabel>
                  </ProgressItem>
                  <ProgressDivider />
                  <ProgressItem>
                    <Icon name="translate" size={24} color="#8b5cf6" />
                    <ProgressValue>{wordStats.viewedCount}</ProgressValue>
                    <ProgressLabel>ПЕРЕВОДОВ</ProgressLabel>
                  </ProgressItem>
                </ProgressGrid>
              )}
            </ProgressCard>
          </ProgressSection>
        )}
        {auth.profile?.role === "admin" && (
          <AdminActionCard
            title="Мини-игра: Слушай и собери фразу"
            description="Тренировка восприятия на слух. Собери фразу из слов."
            onClick={() => navigate("/admin/audio-phrase-game")}
          />
        )}
      </HomeWrapper>
    </PageShell>
  );
}
