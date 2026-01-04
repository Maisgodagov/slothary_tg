export type ThemeName = "light" | "dark";

type ThemeTokens = {
  bg: string;
  surface: string;
  card: string;
  text: string;
  subtle: string;
  accent: string;
  accentStrong: string;
  border: string;
};

export const themes: Record<ThemeName, ThemeTokens> = {
  light: {
    bg: "#f5f7fb",
    surface: "#ffffff",
    card: "#eef2fb",
    text: "#0b1020",
    subtle: "#4b5368",
    accent: "#0f7aa7",
    accentStrong: "#0a5a7d",
    border: "#d7ddeb",
  },
  dark: {
    bg: "#0f111a",
    surface: "#171a27",
    card: "#1f2435",
    text: "#f5f7ff",
    subtle: "#c1c7d6",
    accent: "#6dd3ff",
    accentStrong: "#2ea3ff",
    border: "#2a3042",
  },
};

export function applyThemeTokens(name: ThemeName) {
  const t = themes[name];
  const root = document.documentElement;
  root.style.setProperty("--tg-bg", t.bg);
  root.style.setProperty("--tg-surface", t.surface);
  root.style.setProperty("--tg-card", t.card);
  root.style.setProperty("--tg-text", t.text);
  root.style.setProperty("--tg-subtle", t.subtle);
  root.style.setProperty("--tg-accent", t.accent);
  root.style.setProperty("--tg-accent-strong", t.accentStrong);
  root.style.setProperty("--tg-border", t.border);
}
