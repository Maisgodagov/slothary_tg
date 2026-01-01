import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import WebApp from '@twa-dev/sdk';

type Theme = 'light' | 'dark';

interface TelegramContextValue {
  webApp: typeof WebApp | null;
  theme: Theme;
  initData: string;
}

const TelegramContext = createContext<TelegramContextValue>({
  webApp: null,
  theme: 'dark',
  initData: '',
});

function applyTelegramTheme(theme: Theme) {
  document.body.dataset.theme = theme;
  if (theme === 'light') {
    document.documentElement.style.setProperty('--tg-bg', '#f8f9fe');
    document.documentElement.style.setProperty('--tg-surface', '#ffffff');
    document.documentElement.style.setProperty('--tg-card', '#f3f5fb');
    document.documentElement.style.setProperty('--tg-text', '#0c1021');
    document.documentElement.style.setProperty('--tg-subtle', '#4a4f66');
    document.documentElement.style.setProperty('--tg-accent', '#007aff');
    document.documentElement.style.setProperty('--tg-accent-strong', '#0056d2');
    document.documentElement.style.setProperty('--tg-border', '#d8deed');
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

  const topVV = vv ? Math.max(0, vv.offsetTop) : 0;
  const leftVV = vv ? Math.max(0, vv.offsetLeft) : 0;
  const rightVV = vv ? Math.max(0, innerW - (vv.width + vv.offsetLeft)) : 0;
  const bottomVV = vv ? Math.max(0, innerH - (vv.height + vv.offsetTop)) : 0;

  // Use Telegram viewport heights as additional signal (important in WebApp)
  const webApp = (window as any).Telegram?.WebApp;
  const vh = webApp?.viewportHeight || 0;
  const vsh = webApp?.viewportStableHeight || 0;

  // Difference between innerHeight and reported viewport gives us overlays (headers/nav)
  const topFromVH = vh > 0 ? Math.max(0, innerH - vh) : 0;
  const bottomFromStable = vsh > 0 ? Math.max(0, innerH - vsh) : 0;

  // Fallback padding to avoid overlap with status/nav bars
  const fallbackTop = 32;
  const fallbackBottom = 32;

  const top = Math.max(topVV, topFromVH, fallbackTop);
  const bottom = Math.max(bottomVV, bottomFromStable, fallbackBottom);
  const left = Math.max(leftVV, 0);
  const right = Math.max(rightVV, 0);

  root.style.setProperty('--safe-top', `${top}px`);
  root.style.setProperty('--safe-right', `${right}px`);
  root.style.setProperty('--safe-bottom', `${bottom}px`);
  root.style.setProperty('--safe-left', `${left}px`);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(WebApp?.colorScheme ?? 'dark');

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
    const handleThemeChange = (newTheme: unknown) => {
      if (typeof newTheme === 'string') {
        setTheme(newTheme as Theme);
        applyTelegramTheme(newTheme as Theme);
      }
    };
    WebApp.onEvent('themeChanged', handleThemeChange);

    return () => {
      WebApp.offEvent('themeChanged', handleThemeChange);
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

  const value = useMemo<TelegramContextValue>(
    () => ({
      webApp: WebApp?.initData ? WebApp : null,
      theme,
      initData: WebApp?.initData ?? '',
    }),
    [theme],
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export const useTelegram = () => useContext(TelegramContext);
