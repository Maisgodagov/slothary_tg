import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { LoginForm } from '../features/auth/components/LoginForm';
import { logout, selectAuth } from '../features/auth/slice';
import { Button } from '../shared/ui/Button';
import { useTelegram } from '../app/providers/TelegramProvider';

export default function ProfilePage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const { theme, initData } = useTelegram();

  const telegramInfo = useMemo(() => {
    if (!initData) return null;
    if (auth.profile) return 'Авторизация через Telegram выполнена';
    if (auth.status === 'loading') return 'Авторизация через Telegram...';
    if (auth.error) return `Не удалось авторизоваться через Telegram: ${auth.error}`;
    return 'Данные Telegram получены, выполняем вход...';
  }, [auth.error, auth.profile, auth.status, initData]);

  return (
    <div className="section">
      <div className="section-header">
        <h3 style={{ margin: 0 }}>Профиль</h3>
        <span className="badge">Theme: {theme}</span>
      </div>

      {auth.profile ? (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontWeight: 800 }}>{auth.profile.fullName}</div>
          <div style={{ color: 'var(--tg-subtle)' }}>{auth.profile.email}</div>
          <div style={{ color: 'var(--tg-subtle)' }}>Роль: {auth.profile.role}</div>
          <div style={{ color: 'var(--tg-subtle)' }}>Пройдено уроков: {auth.profile.completedLessons}</div>
          <Button variant="ghost" onClick={() => dispatch(logout())}>
            Выйти
          </Button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Button variant={mode === 'login' ? 'primary' : 'ghost'} onClick={() => setMode('login')}>
              Вход
            </Button>
            <Button variant={mode === 'register' ? 'primary' : 'ghost'} onClick={() => setMode('register')}>
              Регистрация
            </Button>
          </div>
          <LoginForm mode={mode} />
          {telegramInfo && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--tg-subtle)' }}>
              {telegramInfo}
            </div>
          )}
        </>
      )}
    </div>
  );
}
