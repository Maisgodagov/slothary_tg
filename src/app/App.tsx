import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { TelegramProvider, useTelegram } from './providers/TelegramProvider';
import { store, persistor } from './store';
import HomePage from '../pages/HomePage';
import DictionaryPage from '../pages/DictionaryPage';
import VideoPage from '../pages/VideoPage';
import { Loader } from '../shared/ui/Loader';
import { NavBar } from '../shared/ui/NavBar';
import '../shared/styles/global.css';
import { useAppDispatch, useAppSelector } from './hooks';
import { selectAuth, telegramAuth } from '../features/auth/slice';

function AutoTelegramAuth() {
  const { initData } = useTelegram();
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const attempted = useRef(false);

  useEffect(() => {
    if (!initData || auth.profile || attempted.current) return;
    attempted.current = true;
    dispatch(telegramAuth(initData));
  }, [auth.profile, dispatch, initData]);

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
                <Route path="/video" element={<VideoPage />} />
                <Route path="/dictionary" element={<DictionaryPage />} />
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
