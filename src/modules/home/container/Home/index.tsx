import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { useTelegram } from "../../../../app/providers/TelegramProvider";
import { selectAuth } from "../../../../features/auth/slice";
import { getLevelInfo } from "../../../../shared/lib/xp";
import { PageShell } from "../../../../shared/ui/PageShell";
import { homeApi } from "../../api";
import type { DictionaryStats } from "../../api/types";
import { AdminActionCard } from "../../components/AdminActionCard";
import { HomeHeader } from "../../components/HomeHeader";
import { ProgressSummary } from "../../components/ProgressSummary";
import { StreakModal } from "../../components/StreakModal";
import { setLastStatsUpdatedAt } from "../../store/slice";
import { HomeWrapper } from "./styles";

export function HomeContainer() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { themeMode, theme } = useTelegram();
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [wordStats, setWordStats] = useState<DictionaryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const isLightTheme =
    themeMode === "light" || (themeMode === "system" && theme === "light");

  const initial = useMemo(() => {
    const raw = auth.profile?.fullName?.[0] ?? auth.profile?.email?.[0] ?? "U";
    return raw.toUpperCase();
  }, [auth.profile?.email, auth.profile?.fullName]);

  const displayName =
    auth.profile?.fullName?.split(" ").filter(Boolean)[0] ||
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
          isLightTheme={isLightTheme}
          onOpenStreak={() => setShowStreakModal(true)}
          onOpenProfile={() => navigate("/profile")}
        />

        <StreakModal
          open={showStreakModal}
          message={getStreakMessage(streakDays)}
          onClose={() => setShowStreakModal(false)}
        />

        <ProgressSummary
          stats={wordStats}
          loading={statsLoading}
          isAdmin={auth.profile?.role === "admin"}
          onDetails={() => navigate("/admin/word-progress")}
        />

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
