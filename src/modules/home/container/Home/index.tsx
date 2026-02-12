import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { useTelegram } from "../../../../app/providers/TelegramProvider";
import { selectAuth } from "../../../../features/auth/slice";
import { getLevelInfo } from "../../../../shared/lib/xp";
import { PageShell } from "../../../../shared/ui/PageShell";
import { homeApi } from "../../api";
import type { DictionaryStats } from "../../api/types";
import { AddToHomeBanner } from "../../components/AddToHomeBanner";
import { HomeHeader } from "../../components/HomeHeader";
import ProgressSummary from "../../components/ProgressSummary";
import { setLastStatsUpdatedAt } from "../../store/slice";
import {
  HomeSkeletonAvatar,
  HomeSkeletonCard,
  HomeSkeletonHeader,
  HomeSkeletonHeaderLeft,
  HomeSkeletonHeaderText,
  HomeSkeletonLayout,
  HomeSkeletonLine,
  HomeSkeletonStreak,
  HomeWrapper,
} from "./styles";

export function HomeContainer() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { themeMode, theme, webApp } = useTelegram();
  const [wordStats, setWordStats] = useState<DictionaryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [homeScreenStatus, setHomeScreenStatus] = useState<
    "added" | "missed" | "unknown" | "unsupported" | null
  >(null);
  const [installing, setInstalling] = useState(false);
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

  useEffect(() => {
    if (!webApp) return;
    let active = true;

    const normalizeStatus = (value: unknown) => {
      const raw =
        typeof value === "string"
          ? value
          : typeof (value as any)?.status === "string"
            ? (value as any).status
            : null;
      if (!raw) return null;
      const lowered = raw.toLowerCase();
      if (lowered === "added" || lowered === "missed" || lowered === "unknown") {
        return lowered as "added" | "missed" | "unknown";
      }
      if (lowered === "unsupported") return "unsupported";
      return null;
    };

    const handleChecked = (event: unknown) => {
      if (!active) return;
      const status = normalizeStatus(event);
      if (status) setHomeScreenStatus(status);
    };

    const handleAdded = () => {
      if (!active) return;
      setHomeScreenStatus("added");
      setInstalling(false);
    };

    webApp.onEvent?.("homeScreenChecked", handleChecked);
    webApp.onEvent?.("homeScreenAdded", handleAdded);

    if (typeof webApp.checkHomeScreenStatus === "function") {
      try {
        webApp.checkHomeScreenStatus((status: unknown) => {
          handleChecked(status);
        });
      } catch {
        /* ignore */
      }
    } else {
      setHomeScreenStatus("unsupported");
    }

    return () => {
      active = false;
      webApp.offEvent?.("homeScreenChecked", handleChecked);
      webApp.offEvent?.("homeScreenAdded", handleAdded);
    };
  }, [webApp]);

  const showAddToHome = homeScreenStatus === "missed";

  const handleAddToHome = () => {
    if (!webApp || typeof webApp.addToHomeScreen !== "function") return;
    setInstalling(true);
    try {
      webApp.addToHomeScreen();
    } catch {
      setInstalling(false);
    }
  };

  const showSkeleton = statsLoading && !wordStats;

  return (
    <PageShell>
      {showSkeleton ? (
        <HomeSkeletonLayout>
          <HomeSkeletonHeader>
            <HomeSkeletonHeaderLeft>
              <HomeSkeletonAvatar />
              <HomeSkeletonHeaderText>
                <HomeSkeletonLine $w="160px" $h="22px" />
                <HomeSkeletonLine $w="124px" $h="12px" />
              </HomeSkeletonHeaderText>
            </HomeSkeletonHeaderLeft>
            <HomeSkeletonStreak />
          </HomeSkeletonHeader>
          <HomeSkeletonCard>
            <HomeSkeletonLine $w="36%" $h="20px" />
            <HomeSkeletonLine $w="100%" $h="78px" />
          </HomeSkeletonCard>
          <HomeSkeletonCard>
            <HomeSkeletonLine $w="64%" $h="18px" />
            <HomeSkeletonLine $w="44%" $h="32px" />
          </HomeSkeletonCard>
          <HomeSkeletonCard>
            <HomeSkeletonLine $w="52%" $h="16px" />
            <HomeSkeletonLine $w="88%" $h="14px" />
            <HomeSkeletonLine $w="72%" $h="14px" />
          </HomeSkeletonCard>
          <HomeSkeletonCard>
            <HomeSkeletonLine $w="48%" $h="16px" />
            <HomeSkeletonLine $w="90%" $h="40px" />
          </HomeSkeletonCard>
        </HomeSkeletonLayout>
      ) : (
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

          {showAddToHome && (
            <AddToHomeBanner onInstall={handleAddToHome} installing={installing} />
          )}
        </HomeWrapper>
      )}
    </PageShell>
  );
}
