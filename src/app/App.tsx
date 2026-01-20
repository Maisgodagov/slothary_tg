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
import AudioPhraseGamePage from "../pages/AudioPhraseGamePage";
import ModerationPage from "../pages/ModerationPage";
import UserAdminPage from "../pages/UserAdminPage";
import GameSnippetsAdminPage from "../pages/GameSnippetsAdminPage";
import UserDictionaryPage from "../pages/UserDictionaryPage";
import WordProgressPage from "../pages/WordProgressPage";
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
        dispatch(
          setProfile({ ...auth.profile, streakDays: result.streakDays })
        );
      })
      .catch(() => {
        // ignore streak refresh failures
      });
  }, [auth.profile, dispatch]);

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

function App() {
  return (
    <TelegramProvider>
      <Provider store={store}>
        <PersistGate loading={<Loader />} persistor={persistor}>
          <HashRouter>
            <AutoTelegramAuth />
            <StreakRefresher />
            <div className="page">
              <Routes>
                <Route path="/" element={<HomeContainer />} />
                <Route path="/profile" element={<ProfileContainer />} />
                <Route path="/video" element={<VideoContainer />} />
                <Route path="/dictionary" element={<DictionaryContainer />} />
                <Route path="/user-dictionary" element={<UserDictionaryPage />} />
                <Route
                  path="/video-dictionary"
                  element={<Navigate to="/dictionary" replace />}
                />
                <Route path="/admin/moderation" element={<ModerationPage />} />
                <Route path="/admin/users" element={<UserAdminPage />} />
                <Route path="/admin/word-progress" element={<WordProgressPage />} />
                <Route
                  path="/admin/game-snippets"
                  element={<GameSnippetsAdminPage />}
                />
                <Route
                  path="/admin/audio-phrase-game"
                  element={<AudioPhraseGamePage />}
                />
                <Route path="/admin" element={<AdminContainer />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <BackHandler />
          </HashRouter>
        </PersistGate>
      </Provider>
    </TelegramProvider>
  );
}

export default App;
