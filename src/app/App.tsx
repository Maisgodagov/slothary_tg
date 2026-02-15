import { useCallback, useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { TelegramProvider, useTelegram } from "./providers/TelegramProvider";
import { store, persistor } from "./store";
import UserAdminPage from "../pages/UserAdminPage";
import GameSnippetsAdminPage from "../pages/GameSnippetsAdminPage";
import VideoTagsAdminPage from "../pages/VideoTagsAdminPage";
import UserDictionaryPage from "../pages/UserDictionaryPage";
import WordProgressPage from "../pages/WordProgressPage";
import StreakPage from "../pages/StreakPage";
import LessonStepCardDemoPage from "../pages/LessonStepCardDemoPage";
import LessonStepCardQuizDemoPage from "../pages/LessonStepCardQuizDemoPage";
import LessonStepCardFillGapDemoPage from "../pages/LessonStepCardFillGapDemoPage";
import LessonStepCardAssembleDemoPage from "../pages/LessonStepCardAssembleDemoPage";
import WordTrainingPage from "../pages/WordTrainingPage";
import { HomeContainer } from "../modules/home";
import { VideoContainer } from "../modules/video";
import { DictionaryContainer } from "../modules/dictionary";
import { ProfileContainer } from "../modules/profile";
import { AdminContainer } from "../modules/admin";
import { Loader } from "../shared/ui/Loader";
import "../shared/styles/global.css";
import { useAppDispatch, useAppSelector } from "./hooks";
import { selectAuth, setProfile, telegramAuth } from "../features/auth/slice";
import { usersApi } from "../features/users/api";
import { apiFetch } from "../shared/api/client";

function AutoTelegramAuth() {
  const { initData } = useTelegram();
  const dispatch = useAppDispatch();
  const attempted = useRef(false);

  useEffect(() => {
    if (!initData || attempted.current) return;
    attempted.current = true;
    dispatch(telegramAuth(initData));
  }, [dispatch, initData]);

  return null;
}

function StreakRefresher() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const refreshedFor = useRef<string | null>(null);

  useEffect(() => {
    const userId = auth.profile?.id;
    if (!userId || refreshedFor.current === userId) return;
    refreshedFor.current = userId;

    usersApi
      .refreshStreak(userId)
      .then((result) => {
        if (!auth.profile) return;
        dispatch(setProfile({ ...auth.profile, streakDays: result.streakDays }));
      })
      .catch(() => {
        // ignore streak refresh failures
      });
  }, [auth.profile, dispatch]);

  return null;
}

function WelcomeSender() {
  const { initData } = useTelegram();
  const auth = useAppSelector(selectAuth);
  const sentRef = useRef(false);

  useEffect(() => {
    if (!initData || sentRef.current) return;
    if (!auth.tokens?.accessToken) return;
    const key = "welcome-sent";
    if (localStorage.getItem(key) === "1") return;
    sentRef.current = true;
    apiFetch("share/welcome", {
      method: "POST",
      body: { initData },
    })
      .then(() => {
        localStorage.setItem(key, "1");
      })
      .catch(() => {
        // ignore
      });
  }, [auth.tokens?.accessToken, initData]);

  return null;
}

function BackHandler() {
  const { webApp } = useTelegram();
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    if (location.pathname === "/") {
      if (webApp) {
        webApp.close();
      } else {
        window.close();
      }
      return;
    }
    navigate(-1);
  }, [location.pathname, navigate, webApp]);

  useEffect(() => {
    if (!webApp) return;
    webApp.BackButton.show();
    webApp.onEvent("backButtonClicked", handleBack);
    return () => {
      webApp.offEvent("backButtonClicked", handleBack);
    };
  }, [webApp, handleBack]);
  return null;
}

function AppRoutes() {
  const auth = useAppSelector(selectAuth);
  const isAdmin = auth.profile?.role === "admin";
  const location = useLocation();

  useEffect(() => {
    const startParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
    const params = new URLSearchParams(window.location.search);
    const urlWord = params.get("word");
    const urlPhrase = params.get("phrase");
    let rawValue = "";
    let mode: "word" | "phrase" = "word";
    if (typeof startParam === "string" && startParam.startsWith("word_")) {
      rawValue = startParam.slice("word_".length);
      mode = "word";
    } else if (typeof startParam === "string" && startParam.startsWith("phrase_")) {
      rawValue = startParam.slice("phrase_".length);
      mode = "phrase";
    } else if (typeof urlPhrase === "string" && urlPhrase.trim()) {
      rawValue = urlPhrase;
      mode = "phrase";
    } else if (typeof urlWord === "string") {
      rawValue = urlWord;
      mode = "word";
    }
    const value = rawValue.trim();
    const normalizedValue =
      value.includes("_") && !value.includes(" ")
        ? value.replace(/_+/g, " ").trim()
        : value;
    if (!normalizedValue) return;
    const handledKey = `startapp-handled:${mode}:${normalizedValue.toLowerCase()}`;
    if (window.localStorage.getItem(handledKey) === "1") return;
    if (location.hash?.startsWith("#/dictionary")) return;
    const isBlankHash = !location.hash || location.hash === "#/" || location.hash === "#";
    if (!isBlankHash) return;
    const nextParams = new URLSearchParams(
      mode === "phrase" ? { phrase: normalizedValue } : { word: normalizedValue }
    );
    window.localStorage.setItem(handledKey, "1");
    window.location.hash = `#/dictionary?${nextParams.toString()}`;
  }, [location.hash]);

  return (
    <>
      <AutoTelegramAuth />
      <WelcomeSender />
      <StreakRefresher />
      <div className="page">
        <Routes>
          <Route path="/" element={<HomeContainer />} />
          <Route path="/profile" element={<ProfileContainer />} />
          <Route path="/video" element={<VideoContainer />} />
          <Route path="/dictionary" element={<DictionaryContainer />} />
          <Route
            path="/training"
            element={isAdmin ? <WordTrainingPage /> : <Navigate to="/" replace />}
          />
          <Route path="/user-dictionary" element={<UserDictionaryPage />} />
          <Route
            path="/video-dictionary"
            element={<Navigate to="/dictionary" replace />}
          />
          <Route path="/admin/users" element={<UserAdminPage />} />
          <Route path="/admin/video-tags" element={<VideoTagsAdminPage />} />
          <Route path="/admin/word-progress" element={<WordProgressPage />} />
          <Route path="/streak" element={<StreakPage />} />
          <Route
            path="/admin/game-snippets"
            element={<GameSnippetsAdminPage />}
          />
          <Route path="/demo/lesson-card" element={<LessonStepCardDemoPage />} />
          <Route
            path="/demo/lesson-card-quiz"
            element={<LessonStepCardQuizDemoPage />}
          />
          <Route
            path="/demo/lesson-card-fill-gap"
            element={<LessonStepCardFillGapDemoPage />}
          />
          <Route
            path="/demo/lesson-card-assemble"
            element={<LessonStepCardAssembleDemoPage />}
          />
          <Route path="/admin" element={<AdminContainer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BackHandler />
    </>
  );
}

function App() {
  return (
    <TelegramProvider>
      <Provider store={store}>
        <PersistGate loading={<Loader />} persistor={persistor}>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </PersistGate>
      </Provider>
    </TelegramProvider>
  );
}

export default App;

