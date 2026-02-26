import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { useTelegram } from "../../../../app/providers/TelegramProvider";
import { selectAuth } from "../../../../features/auth/slice";
import { wordTrainingApi, type WordTrainingOverview } from "../../../../features/word-training/api";
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
  HomeSkeletonCircle,
  HomeSkeletonHeader,
  HomeSkeletonHeaderLeft,
  HomeSkeletonHeaderText,
  HomeSkeletonLayout,
  HomeSkeletonLine,
  HomeSkeletonStreak,
  HomeSkeletonTopLeft,
  HomeSkeletonTopRow,
  HomeWrapper,
  NextTrainingButton,
  NextTrainingButtonLabel,
  NextTrainingButtonSub,
  NextTrainingCard,
  NextTrainingCounter,
  NextTrainingHeaderWrap,
  NextTrainingLevelBadge,
  NextTrainingLevelText,
  NextTrainingProgressFill,
  NextTrainingProgressTrack,
  NextTrainingTitleRow,
  NextTrainingTopRow,
  NextTrainingTitle,
} from "./styles";

export function HomeContainer() {
  const auth = useAppSelector(selectAuth);
  const isAdmin = auth.profile?.role === "admin";
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { themeMode, theme, webApp } = useTelegram();
  const [wordStats, setWordStats] = useState<DictionaryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [trainingOverview, setTrainingOverview] = useState<WordTrainingOverview | null>(null);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [startingTraining, setStartingTraining] = useState(false);
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
    if (!auth.profile?.id || !isAdmin) {
      setTrainingOverview(null);
      return;
    }
    setTrainingLoading(true);
    wordTrainingApi
      .getOverview(auth.profile.id)
      .then((overview) => setTrainingOverview(overview))
      .catch(() => setTrainingOverview(null))
      .finally(() => setTrainingLoading(false));
  }, [auth.profile?.id, isAdmin]);

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

  const handleStartNextTraining = async () => {
    if (!auth.profile?.id || startingTraining) return;
    setStartingTraining(true);
    try {
      type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
      const userLevelRaw = auth.profile.level;
      const userLevel: CefrLevel =
        userLevelRaw === "A1" ||
        userLevelRaw === "A2" ||
        userLevelRaw === "B1" ||
        userLevelRaw === "B2" ||
        userLevelRaw === "C1" ||
        userLevelRaw === "C2"
          ? userLevelRaw
          : "A1";

      const targetWords = Math.min(5, Math.max(1, trainingOverview?.suggestedTargetWords ?? 5));
      const preferences = {
        cefrLevel: userLevel,
        maxUniqueWords: 5,
        maxMatchPairsPerSession: 1,
        prioritizeUserInteractions: true,
        levelMix: {
          currentLevelWeight: 0.7,
          lowerLevelWeight: 0.15,
          higherLevelWeight: 0.15,
        },
        reinforcementMode: {
          phraseExercisesPerWord: 3,
          retryMistakesAtEnd: true,
        },
      };

      if (trainingOverview?.activeSession?.id) {
        navigate("/learn");
        return;
      }

      await wordTrainingApi.startSession(
        {
          targetWords,
          preferences,
        },
        auth.profile.id,
      );
      navigate("/learn");
    } catch {
      navigate("/learn");
    } finally {
      setStartingTraining(false);
    }
  };

  const showSkeleton = statsLoading && !wordStats;
  const currentBlockTitle = (trainingOverview?.currentBlockTitle || "Стартовый набор I").trim();
  const currentBlockKnown = trainingOverview?.currentBlockProgress?.knownWords ?? 0;
  const currentBlockTotal = trainingOverview?.currentBlockProgress?.totalWords ?? 0;
  const currentBlockPercent = Math.max(
    0,
    Math.min(100, Number(trainingOverview?.currentBlockProgress?.percent ?? 0)),
  );
  const currentLevel = String(trainingOverview?.currentLevel || auth.profile?.level || "A1")
    .trim()
    .toUpperCase();

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
          {isAdmin && (
            <HomeSkeletonCard>
              <HomeSkeletonTopRow>
                <HomeSkeletonTopLeft>
                  <HomeSkeletonLine $w="48%" $h="16px" />
                  <HomeSkeletonLine $w="86%" $h="5px" />
                </HomeSkeletonTopLeft>
                <HomeSkeletonCircle />
              </HomeSkeletonTopRow>
              <HomeSkeletonLine $w="100%" $h="56px" />
            </HomeSkeletonCard>
          )}
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

          {isAdmin && (
            <>
              <NextTrainingCard>
                <NextTrainingTopRow>
                  <NextTrainingHeaderWrap>
                    <NextTrainingTitleRow>
                      <NextTrainingTitle>{currentBlockTitle}</NextTrainingTitle>
                      <NextTrainingCounter>{`${currentBlockKnown}/${currentBlockTotal}`}</NextTrainingCounter>
                    </NextTrainingTitleRow>
                    <NextTrainingProgressTrack>
                      <NextTrainingProgressFill $width={currentBlockPercent} />
                    </NextTrainingProgressTrack>
                  </NextTrainingHeaderWrap>
                  <NextTrainingLevelBadge>
                    <NextTrainingLevelText>{currentLevel || "A1"}</NextTrainingLevelText>
                  </NextTrainingLevelBadge>
                </NextTrainingTopRow>

                <NextTrainingButton
                  type="button"
                  onClick={handleStartNextTraining}
                  disabled={startingTraining || trainingLoading}
                >
                  <NextTrainingButtonLabel>
                    <span>{startingTraining ? "Запуск..." : "Продолжить тренировку"}</span>
                    <NextTrainingButtonSub>С того места, где остановился</NextTrainingButtonSub>
                  </NextTrainingButtonLabel>
                </NextTrainingButton>
              </NextTrainingCard>

            </>
          )}

          {showAddToHome && (
            <AddToHomeBanner onInstall={handleAddToHome} installing={installing} />
          )}
        </HomeWrapper>
      )}
    </PageShell>
  );
}
