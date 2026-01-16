import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import WebApp from '@twa-dev/sdk';
import { applyThemeTokens, type ThemeName } from '../../shared/styles/theme';

type Theme = ThemeName;
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
  applyThemeTokens(theme);
}

function updateSafeAreaFromViewport() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const vv = window.visualViewport;
  const innerW = window.innerWidth || 0;
  const innerH = window.innerHeight || 0;
  const visualHeight = vv?.height || 0;

  const webApp = (window as any).Telegram?.WebApp;
  const vh = webApp?.viewportHeight || 0;
  const vsh = webApp?.viewportStableHeight || 0;
  const tgSafe = webApp?.safeAreaInset;
  const tgContentSafe = webApp?.contentSafeAreaInset;

  // Insets from visual viewport (browser chrome)
  const topVV = vv ? Math.max(0, vv.offsetTop) : 0;
  const leftVV = vv ? Math.max(0, vv.offsetLeft) : 0;
  const rightVV = vv ? Math.max(0, innerW - (vv.width + vv.offsetLeft)) : 0;
  const bottomVV = vv ? Math.max(0, innerH - (vv.height + vv.offsetTop)) : 0;

  // Insets reported by Telegram or visual viewport fallback.
  const top = Number(tgContentSafe?.top ?? tgSafe?.top ?? topVV ?? 0);
  const bottom = Number(tgContentSafe?.bottom ?? tgSafe?.bottom ?? bottomVV ?? 0);
  const left = Number(tgContentSafe?.left ?? tgSafe?.left ?? leftVV ?? 0);
  const right = Number(tgContentSafe?.right ?? tgSafe?.right ?? rightVV ?? 0);

  root.style.setProperty('--app-safe-top', `${top}px`);
  root.style.setProperty('--app-safe-right', `${right}px`);
  root.style.setProperty('--app-safe-bottom', `${bottom}px`);
  root.style.setProperty('--app-safe-left', `${left}px`);

  const appHeight = vsh || vh || visualHeight || innerH || 0;
  if (appHeight > 0) {
    root.style.setProperty('--app-height', `${appHeight}px`);
  }
}

function updateKeyboardState() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const vv = window.visualViewport;
  if (!vv) {
    root.classList.remove('keyboard-open');
    return;
  }
  const threshold = 120;
  const keyboardOpen = window.innerHeight - vv.height > threshold;
  root.classList.toggle('keyboard-open', keyboardOpen);
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
    if (typeof WebApp.requestFullscreen === 'function') {
      WebApp.requestFullscreen();
    }
    WebApp.disableVerticalSwipes();
    WebApp.disableClosingConfirmation?.();
    WebApp.setHeaderColor('bg_color');
    WebApp.setBackgroundColor('#0f111a');

    applyTelegramTheme(WebApp.colorScheme ?? 'dark');
    setSystemTheme(WebApp.colorScheme ?? 'dark');
    updateSafeAreaFromViewport();
    updateKeyboardState();

    const handleThemeChange = (newTheme: unknown) => {
      if (typeof newTheme === 'string') {
        setSystemTheme(newTheme as Theme);
        if (themeMode === 'system') {
          applyTelegramTheme(newTheme as Theme);
        }
      }
    };

    const handleViewportChange = () => {
      if (!WebApp.isExpanded) {
        WebApp.expand();
      }
      if (typeof WebApp.requestFullscreen === 'function') {
        WebApp.requestFullscreen();
      }
      updateSafeAreaFromViewport();
      updateKeyboardState();
    };

    WebApp.onEvent('themeChanged', handleThemeChange);
    WebApp.onEvent('viewportChanged', handleViewportChange);
    WebApp.onEvent?.('safeAreaChanged', handleViewportChange);
    WebApp.onEvent?.('contentSafeAreaChanged', handleViewportChange);

    return () => {
      WebApp.offEvent('themeChanged', handleThemeChange);
      WebApp.offEvent('viewportChanged', handleViewportChange);
      WebApp.offEvent?.('safeAreaChanged', handleViewportChange);
      WebApp.offEvent?.('contentSafeAreaChanged', handleViewportChange);
    };
  }, []);

  useEffect(() => applyTelegramTheme(theme), [theme]);

  useEffect(() => {
    updateSafeAreaFromViewport();
    updateKeyboardState();
    const vv = window.visualViewport;
    if (!vv) return;
    const listener = () => {
      updateSafeAreaFromViewport();
      updateKeyboardState();
    };
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
