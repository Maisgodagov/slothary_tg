import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import WebApp from '@twa-dev/sdk';

type Theme = 'light' | 'dark';
type ThemeMode = 'system' | Theme;

interface TelegramContextValue {
  webApp: typeof WebApp | null;
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  initData: string;
}

const TelegramContext = createContext<TelegramContextValue>({
  webApp: null,
  theme: 'dark',
  themeMode: 'system',
  setThemeMode: () => {},
  initData: '',
});

function applyTelegramTheme(theme: Theme) {
  document.body.dataset.theme = theme;
  if (theme === 'light') {
    document.documentElement.style.setProperty('--tg-bg', '#f5f7fb');
    document.documentElement.style.setProperty('--tg-surface', '#ffffff');
    document.documentElement.style.setProperty('--tg-card', '#eef2fb');
    document.documentElement.style.setProperty('--tg-text', '#0b1020');
    document.documentElement.style.setProperty('--tg-subtle', '#4b5368');
    document.documentElement.style.setProperty('--tg-accent', '#0f7aa7');
    document.documentElement.style.setProperty('--tg-accent-strong', '#0a5a7d');
    document.documentElement.style.setProperty('--tg-border', '#d7ddeb');
  } else {
    document.documentElement.style.setProperty('--tg-bg', '#0f111a');
    document.documentElement.style.setProperty('--tg-surface', '#171a27');
    document.documentElement.style.setProperty('--tg-card', '#1f2435');
    document.documentElement.style.setProperty('--tg-text', '#f5f7ff');
    document.documentElement.style.setProperty('--tg-subtle', '#c1c7d6');
    document.documentElement.style.setProperty('--tg-accent', '#6dd3ff');
    document.documentElement.style.setProperty('--tg-accent-strong', '#2ea3ff');
    document.documentElement.style.setProperty('--tg-border', '#2a3042');
  }
}

function updateSafeAreaFromViewport() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const vv = window.visualViewport;
  const innerW = window.innerWidth || 0;
  const innerH = window.innerHeight || 0;

  const webApp = (window as any).Telegram?.WebApp;
  const vh = webApp?.viewportHeight || 0;
  const vsh = webApp?.viewportStableHeight || 0;

  // Insets from visual viewport (browser chrome)
  const topVV = vv ? Math.max(0, vv.offsetTop) : 0;
  const leftVV = vv ? Math.max(0, vv.offsetLeft) : 0;
  const rightVV = vv ? Math.max(0, innerW - (vv.width + vv.offsetLeft)) : 0;
  const bottomVV = vv ? Math.max(0, innerH - (vv.height + vv.offsetTop)) : 0;

  // Insets that Telegram сообщает: разница между stable и текущей высотой
  const bottomFromTelegram = vsh && vh ? Math.max(0, vsh - vh) : 0;
  const topFromTelegram = Math.max(0, innerH - Math.max(vh, vsh));

  const extraTop = 5;
  const extraBottom = 20;

  const top = Math.max(topVV, topFromTelegram) + extraTop;
  const bottom = Math.max(bottomVV, bottomFromTelegram) + extraBottom;
  const left = leftVV;
  const right = rightVV;

  root.style.setProperty('--safe-top', `${top}px`);
  root.style.setProperty('--safe-right', `${right}px`);
  root.style.setProperty('--safe-bottom', `${bottom}px`);
  root.style.setProperty('--safe-left', `${left}px`);
  root.style.setProperty('--tg-safe-area-inset-top', `${top}px`);
  root.style.setProperty('--tg-safe-area-inset-right', `${right}px`);
  root.style.setProperty('--tg-safe-area-inset-bottom', `${bottom}px`);
  root.style.setProperty('--tg-safe-area-inset-left', `${left}px`);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [systemTheme, setSystemTheme] = useState<Theme>(WebApp?.colorScheme ?? 'dark');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem('tg-theme-mode');
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {
      /* ignore */
    }
    return 'system';
  });

  const theme: Theme = themeMode === 'system' ? systemTheme : themeMode;

  useEffect(() => {
    if (!WebApp?.initData) {
      return;
    }

    WebApp.ready();
    WebApp.expand();
    WebApp.disableVerticalSwipes();
    WebApp.setHeaderColor('bg_color');
    WebApp.setBackgroundColor('#0f111a');

    applyTelegramTheme(WebApp.colorScheme ?? 'dark');
    setSystemTheme(WebApp.colorScheme ?? 'dark');
    updateSafeAreaFromViewport();

    const handleThemeChange = (newTheme: unknown) => {
      if (typeof newTheme === 'string') {
        setSystemTheme(newTheme as Theme);
        if (themeMode === 'system') {
          applyTelegramTheme(newTheme as Theme);
        }
      }
    };

    const handleViewportChange = () => {
      updateSafeAreaFromViewport();
    };

    WebApp.onEvent('themeChanged', handleThemeChange);
    WebApp.onEvent('viewportChanged', handleViewportChange);

    return () => {
      WebApp.offEvent('themeChanged', handleThemeChange);
      WebApp.offEvent('viewportChanged', handleViewportChange);
    };
  }, []);

  useEffect(() => applyTelegramTheme(theme), [theme]);

  useEffect(() => {
    updateSafeAreaFromViewport();
    const vv = window.visualViewport;
    if (!vv) return;
    const listener = () => updateSafeAreaFromViewport();
    vv.addEventListener('resize', listener);
    vv.addEventListener('scroll', listener);
    window.addEventListener('orientationchange', listener);
    return () => {
      vv.removeEventListener('resize', listener);
      vv.removeEventListener('scroll', listener);
      window.removeEventListener('orientationchange', listener);
    };
  }, []);

  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mql) return;
    const handler = () => setSystemTheme(mql.matches ? 'dark' : 'light');
    handler();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('tg-theme-mode', themeMode);
    } catch {
      /* ignore */
    }
  }, [themeMode]);

  const value = useMemo<TelegramContextValue>(
    () => ({
      webApp: WebApp?.initData ? WebApp : null,
      theme,
      themeMode,
      setThemeMode,
      initData: WebApp?.initData ?? '',
    }),
    [theme, themeMode],
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export const useTelegram = () => useContext(TelegramContext);
