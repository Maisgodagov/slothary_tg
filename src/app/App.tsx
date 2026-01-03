import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { TelegramProvider, useTelegram } from './providers/TelegramProvider';
import { store, persistor } from './store';
import HomePage from '../pages/HomePage';
import DictionaryPage from '../pages/DictionaryPage';
import VideoPage from '../pages/VideoPage';
import ModerationPage from '../pages/ModerationPage';
import ProfilePage from '../pages/ProfilePage';
import { Loader } from '../shared/ui/Loader';
import { NavBar } from '../shared/ui/NavBar';
import '../shared/styles/global.css';
import { useAppDispatch } from './hooks';
import { telegramAuth } from '../features/auth/slice';

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

function App() {
  return (
    <TelegramProvider>
      <Provider store={store}>
        <PersistGate loading={<Loader />} persistor={persistor}>
          <HashRouter>
            <AutoTelegramAuth />
            <div className="page">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/video" element={<VideoPage />} />
                <Route path="/dictionary" element={<DictionaryPage />} />
                <Route path="/admin/moderation" element={<ModerationPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <NavBar />
          </HashRouter>
        </PersistGate>
      </Provider>
    </TelegramProvider>
  );
}

export default App;
