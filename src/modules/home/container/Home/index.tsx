import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { useTelegram } from "../../../../app/providers/TelegramProvider";
import { selectAuth } from "../../../../features/auth/slice";
import { getLevelInfo } from "../../../../shared/lib/xp";
import { PageShell } from "../../../../shared/ui/PageShell";
import { homeApi } from "../../api";
import type { DictionaryStats } from "../../api/types";
import { HomeHeader } from "../../components/HomeHeader";
import ProgressSummary from "../../components/ProgressSummary";
import { setLastStatsUpdatedAt } from "../../store/slice";
import { HomeWrapper } from "./styles";
import { LearningPathSection } from "../../components/LearningPath";

export function HomeContainer() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { themeMode, theme } = useTelegram();
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
          onOpenStreak={() => navigate("/streak")}
          onOpenProfile={() => navigate("/profile")}
        />

        <ProgressSummary
          stats={wordStats}
          loading={statsLoading}
          onDetails={() => navigate("/admin/word-progress")}
        />

        {auth.profile?.role === "admin" && <LearningPathSection />}

        {auth.profile?.role === "admin" && (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 600 }}>Демо</div>
            <button
              type="button"
              onClick={() => navigate("/demo/lesson-card")}
              style={{
                borderRadius: 16,
                border: "1px solid var(--tg-border)",
                background: "var(--tg-card)",
                color: "var(--tg-text)",
                padding: "12px 14px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              Карточка шага урока
            </button>
            <button
              type="button"
              onClick={() => navigate("/demo/lesson-card-quiz")}
              style={{
                borderRadius: 16,
                border: "1px solid var(--tg-border)",
                background: "var(--tg-card)",
                color: "var(--tg-text)",
                padding: "12px 14px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              Карточка шага урока — квиз
            </button>
            <button
              type="button"
              onClick={() => navigate("/demo/lesson-card-fill-gap")}
              style={{
                borderRadius: 16,
                border: "1px solid var(--tg-border)",
                background: "var(--tg-card)",
                color: "var(--tg-text)",
                padding: "12px 14px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              Карточка шага урока — fill gap
            </button>
            <button
              type="button"
              onClick={() => navigate("/demo/lesson-card-assemble")}
              style={{
                borderRadius: 16,
                border: "1px solid var(--tg-border)",
                background: "var(--tg-card)",
                color: "var(--tg-text)",
                padding: "12px 14px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              Карточка шага урока — assemble
            </button>
          </div>
        )}
      </HomeWrapper>
    </PageShell>
  );
}
