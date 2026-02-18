import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { logout, selectAuth, setProfile } from "../../../../features/auth/slice";
import { dictionaryApi, type DictionaryStats } from "../../../../features/dictionary/api";
import { usersApi, type CefrLevel } from "../../../../features/users/api";
import { getLevelInfo } from "../../../../shared/lib/xp";
import { PageShell } from "../../../../shared/ui/PageShell";
import { useTelegram } from "../../../../app/providers/TelegramProvider";
import { AuthCard } from "../../components/AuthCard";
import { ProfileSummary } from "../../components/ProfileSummary";
import { ThemeToggle } from "../../components/ThemeToggle";
import { setLastVisitedAt } from "../../store/slice";
import { HeaderRow, HeaderTitle, ProfileWrapper } from "./styles";

export function ProfileContainer() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const { themeMode, setThemeMode, theme } = useTelegram();
  const isDark =
    themeMode === "dark" || (themeMode === "system" && theme === "dark");
  const [wordStats, setWordStats] = useState<DictionaryStats | null>(null);
  const [selectedCefrLevel, setSelectedCefrLevel] = useState<CefrLevel>("A1");
  const [savingLevel, setSavingLevel] = useState(false);

  useEffect(() => {
    dispatch(setLastVisitedAt(new Date().toISOString()));
  }, [dispatch]);

  useEffect(() => {
    if (!auth.profile?.id) return;
    dictionaryApi
      .getStats(auth.profile.id)
      .then((stats) => setWordStats(stats))
      .catch(() => setWordStats(null));
  }, [auth.profile?.id]);

  useEffect(() => {
    const level = String(auth.profile?.level ?? "A1").toUpperCase() as CefrLevel;
    if (["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) {
      setSelectedCefrLevel(level);
    } else {
      setSelectedCefrLevel("A1");
    }
  }, [auth.profile?.level]);

  const initials = useMemo(() => {
    const name = auth.profile?.fullName || auth.profile?.email || "";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [auth.profile]);

  if (!auth.profile) {
    return (
      <PageShell>
        <ProfileWrapper>
          <HeaderRow className="page-header">
            <HeaderTitle>Профиль</HeaderTitle>
          </HeaderRow>

          <AuthCard mode={mode} onModeChange={setMode} />
        </ProfileWrapper>
      </PageShell>
    );
  }

  const { fullName, email, role, avatarUrl } = auth.profile;
  const isTelegramUser = email?.endsWith("@telegram.local");
  const xpPoints = auth.profile.xpPoints ?? 0;
  const levelInfo = getLevelInfo(xpPoints);

  const handleCefrLevelChange = async (nextLevel: CefrLevel) => {
    setSelectedCefrLevel(nextLevel);
    if (!auth.profile?.id || savingLevel) return;
    const currentLevel = String(auth.profile.level ?? "A1").toUpperCase() as CefrLevel;
    if (nextLevel === currentLevel) return;
    setSavingLevel(true);
    try {
      const result = await usersApi.updateLevel(nextLevel, auth.profile.id);
      dispatch(
        setProfile({
          ...auth.profile,
          level: result.level,
        }),
      );
    } finally {
      setSavingLevel(false);
    }
  };

  return (
    <PageShell>
      <ProfileWrapper>
        <ProfileSummary
          fullName={fullName}
          role={role}
          avatarUrl={avatarUrl}
          initials={initials}
          xpPoints={xpPoints}
          levelLabel={levelInfo.level}
          streakDays={auth.profile?.streakDays ?? 0}
          wordsLearned={wordStats?.knownCount ?? 0}
          isTelegramUser={Boolean(isTelegramUser)}
          onLogout={() => dispatch(logout())}
          onOpenAdmin={role === "admin" ? () => navigate("/admin") : undefined}
          onContact={() => undefined}
          onOpenWordProgress={() => navigate("/admin/word-progress")}
          cefrLevel={selectedCefrLevel}
          onCefrLevelChange={(level) => {
            void handleCefrLevelChange(level);
          }}
          savingCefrLevel={savingLevel}
        >
          <ThemeToggle
            themeMode={themeMode}
            systemTheme={theme}
            onToggle={() => setThemeMode(isDark ? "light" : "dark")}
          />
        </ProfileSummary>
      </ProfileWrapper>
    </PageShell>
  );
}
