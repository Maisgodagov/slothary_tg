import { useCallback, useEffect, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { TelegramProvider, useTelegram } from './providers/TelegramProvider';
import { store, persistor } from './store';
import HomePage from '../pages/HomePage';
import VideoDictionaryPage from '../pages/DictionaryPage';
import WordDictionaryPage from '../pages/WordDictionaryPage';
import VideoPage from '../pages/VideoPage';
import ModerationPage from '../pages/ModerationPage';
import UserAdminPage from '../pages/UserAdminPage';
import ProfilePage from '../pages/ProfilePage';
import { Loader } from '../shared/ui/Loader';
import '../shared/styles/global.css';
import { useAppDispatch, useAppSelector } from './hooks';
import { selectAuth, setProfile, telegramAuth } from '../features/auth/slice';
import { usersApi } from '../features/users/api';

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

function BackHandler() {
  const { webApp } = useTelegram();
  const location = useLocation();
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);

  const handleBack = useCallback(() => {
    if (showExit) {
      setShowExit(false);
      return;
    }
    if (location.pathname === '/') {
      setShowExit(true);
      return;
    }
    navigate(-1);
  }, [showExit, location.pathname, navigate]);

  useEffect(() => {
    if (!webApp) return;
    webApp.BackButton.show();
    webApp.onEvent('backButtonClicked', handleBack);
    return () => {
      webApp.offEvent('backButtonClicked', handleBack);
    };
  }, [webApp, handleBack]);

  useEffect(() => {
    setShowExit(false);
  }, [location.pathname]);

  if (!showExit) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
      onClick={() => setShowExit(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--tg-card)',
          border: '1px solid var(--tg-border)',
          borderRadius: 16,
          padding: 18,
          color: 'var(--tg-text)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Уже уходите?</div>
        <div style={{ color: 'var(--tg-subtle)', fontSize: 14, marginBottom: 16 }}>
          Вы действительно хотите закрыть приложение?
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowExit(false)}
            style={{
              flex: 1,
              border: '1px solid var(--tg-border)',
              background: 'var(--tg-surface)',
              color: 'var(--tg-text)',
              borderRadius: 10,
              padding: '10px 12px',
              fontWeight: 600,
            }}
          >
            Остаться
          </button>
          <button
            type="button"
            onClick={() => {
              if (webApp) {
                webApp.close();
              } else {
                window.close();
              }
            }}
            style={{
              flex: 1,
              border: '1px solid transparent',
              background: 'var(--tg-accent-strong)',
              color: '#0c1021',
              borderRadius: 10,
              padding: '10px 12px',
              fontWeight: 700,
            }}
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
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
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/video" element={<VideoPage />} />
                <Route path="/dictionary" element={<WordDictionaryPage />} />
                <Route path="/video-dictionary" element={<VideoDictionaryPage />} />
                <Route path="/admin/moderation" element={<ModerationPage />} />
                <Route path="/admin/users" element={<UserAdminPage />} />
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
