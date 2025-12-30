import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { TelegramProvider } from './providers/TelegramProvider';
import { store, persistor } from './store';
import HomePage from '../pages/HomePage';
import DictionaryPage from '../pages/DictionaryPage';
import ProfilePage from '../pages/ProfilePage';
import AdminPage from '../pages/AdminPage';
import { Loader } from '../shared/ui/Loader';
import { NavBar } from '../shared/ui/NavBar';
import '../shared/styles/global.css';

function App() {
  return (
    <TelegramProvider>
      <Provider store={store}>
        <PersistGate loading={<Loader />} persistor={persistor}>
          <HashRouter>
            <div className="page">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dictionary" element={<DictionaryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
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
