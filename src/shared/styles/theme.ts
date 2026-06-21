export type ThemeName = "light" | "dark";

type ThemeTokens = {
  bg: string;
  surface: string;
  card: string;
  cardStrong: string;
  text: string;
  textStrong: string;
  textOnAccent: string;
  subtle: string;
  accent: string;
  accentStrong: string;
  border: string;
  success: string;
  danger: string;
  warning: string;
  overlay: string;
  overlayStrong: string;
  buttonPrimaryBg: string;
  buttonPrimaryBorder: string;
  buttonPrimaryShadow: string;
  buttonPrimaryText: string;
  buttonPositiveBg: string;
  buttonPositiveBorder: string;
  buttonPositiveShadow: string;
  buttonPositiveText: string;
  buttonNegativeBg: string;
  buttonNegativeBorder: string;
  buttonNegativeShadow: string;
  buttonNegativeText: string;
  buttonNeutralBg: string;
  buttonNeutralBorder: string;
  buttonNeutralShadow: string;
  buttonNeutralText: string;
  videoOverlayBg: string;
  videoOverlayText: string;
  videoSubtitleSecondary: string;
  mediaBg: string;
  highlight: string;
  brandBlue: string;
  brandOrange: string;
  brandPurple: string;
  brandTeal: string;
  brandGreen: string;
  shadowSoft: string;
  shadowStrong: string;
};

export const themes: Record<ThemeName, ThemeTokens> = {
  light: {
    bg: "#F0F9FF",
    surface: "#FBFCFE",
    card: "#E6F4FF",
    cardStrong: "#FFFFFF",
    text: "#1E2A4A",
    textStrong: "#131C33",
    textOnAccent: "#ffffff",
    subtle: "#7480B7",
    accent: "#7480B7",
    accentStrong: "#7480B7",
    border: "#D6EAF7",
    success: "#58AC65",
    danger: "#E56D79",
    warning: "#F8AE2B",
    overlay: "rgba(7, 12, 24, 0.45)",
    overlayStrong: "rgba(7, 12, 24, 0.72)",
    buttonPrimaryBg: "#7480B7",
    buttonPrimaryBorder: "#7480B7",
    buttonPrimaryShadow: "#5B6697",
    buttonPrimaryText: "#ffffff",
    buttonPositiveBg: "#58AC65",
    buttonPositiveBorder: "#58AC65",
    buttonPositiveShadow: "#3E8E4A",
    buttonPositiveText: "#ffffff",
    buttonNegativeBg: "#F8AE2B",
    buttonNegativeBorder: "#F8AE2B",
    buttonNegativeShadow: "#CC8A1E",
    buttonNegativeText: "#ffffff",
    buttonNeutralBg: "#FFFFFF",
    buttonNeutralBorder: "#D6EAF7",
    buttonNeutralShadow: "#C7DFF2",
    buttonNeutralText: "#1E2A4A",
    videoOverlayBg: "rgba(7, 12, 24, 0.72)",
    videoOverlayText: "#ffffff",
    videoSubtitleSecondary: "#ffffff",
    mediaBg: "#000000",
    highlight: "#F8AE2B",
    brandBlue: "#52C3FF",
    brandOrange: "#F8AE2B",
    brandPurple: "#7480B7",
    brandTeal: "#5CD2D2",
    brandGreen: "#58AC65",
    shadowSoft: "rgba(15, 23, 42, 0.08)",
    shadowStrong: "rgba(15, 23, 42, 0.24)",
  },
  dark: {
    bg: "#0f111a",
    surface: "#171a27",
    card: "#1f2435",
    cardStrong: "#1a2030",
    text: "#f5f7ff",
    textStrong: "#ffffff",
    textOnAccent: "#ffffff",
    subtle: "#c1c7d6",
    accent: "#6dd3ff",
    accentStrong: "#2ea3ff",
    border: "#2a3042",
    success: "#35c759",
    danger: "#ff5f6d",
    warning: "#ffc857",
    overlay: "rgba(0, 0, 0, 0.45)",
    overlayStrong: "rgba(0, 0, 0, 0.72)",
    buttonPrimaryBg: "#7480B7",
    buttonPrimaryBorder: "#7480B7",
    buttonPrimaryShadow: "#5B6697",
    buttonPrimaryText: "#ffffff",
    buttonPositiveBg: "#4dcf75",
    buttonPositiveBorder: "#4dcf75",
    buttonPositiveShadow: "#2e9d52",
    buttonPositiveText: "#ffffff",
    buttonNegativeBg: "#F8AE2B",
    buttonNegativeBorder: "#F8AE2B",
    buttonNegativeShadow: "#CC8A1E",
    buttonNegativeText: "#ffffff",
    buttonNeutralBg: "#20273a",
    buttonNeutralBorder: "#2a3042",
    buttonNeutralShadow: "#151b2a",
    buttonNeutralText: "#f5f7ff",
    videoOverlayBg: "rgba(0, 0, 0, 0.72)",
    videoOverlayText: "#ffffff",
    videoSubtitleSecondary: "#c1c7d6",
    mediaBg: "#000000",
    highlight: "#ffd54a",
    brandBlue: "#52C3FF",
    brandOrange: "#F8AE2B",
    brandPurple: "#7480B7",
    brandTeal: "#5CD2D2",
    brandGreen: "#58AC65",
    shadowSoft: "rgba(0, 0, 0, 0.2)",
    shadowStrong: "rgba(0, 0, 0, 0.45)",
  },
};

export function applyThemeTokens(name: ThemeName) {
  const t = themes[name];
  const root = document.documentElement;
  root.style.setProperty("--tg-bg", t.bg);
  root.style.setProperty("--tg-surface", t.surface);
  root.style.setProperty("--tg-card", t.card);
  root.style.setProperty("--tg-card-strong", t.cardStrong);
  root.style.setProperty("--tg-text", t.text);
  root.style.setProperty("--tg-text-strong", t.textStrong);
  root.style.setProperty("--tg-text-on-accent", t.textOnAccent);
  root.style.setProperty("--tg-subtle", t.subtle);
  root.style.setProperty("--tg-accent", t.accent);
  root.style.setProperty("--tg-accent-strong", t.accentStrong);
  root.style.setProperty("--tg-border", t.border);
  root.style.setProperty("--tg-success", t.success);
  root.style.setProperty("--tg-danger", t.danger);
  root.style.setProperty("--tg-warning", t.warning);
  root.style.setProperty("--tg-overlay", t.overlay);
  root.style.setProperty("--tg-overlay-strong", t.overlayStrong);
  root.style.setProperty("--tg-button-primary-bg", t.buttonPrimaryBg);
  root.style.setProperty("--tg-button-primary-border", t.buttonPrimaryBorder);
  root.style.setProperty("--tg-button-primary-shadow", t.buttonPrimaryShadow);
  root.style.setProperty("--tg-button-primary-text", t.buttonPrimaryText);
  root.style.setProperty("--tg-button-positive-bg", t.buttonPositiveBg);
  root.style.setProperty("--tg-button-positive-border", t.buttonPositiveBorder);
  root.style.setProperty("--tg-button-positive-shadow", t.buttonPositiveShadow);
  root.style.setProperty("--tg-button-positive-text", t.buttonPositiveText);
  root.style.setProperty("--tg-button-negative-bg", t.buttonNegativeBg);
  root.style.setProperty("--tg-button-negative-border", t.buttonNegativeBorder);
  root.style.setProperty("--tg-button-negative-shadow", t.buttonNegativeShadow);
  root.style.setProperty("--tg-button-negative-text", t.buttonNegativeText);
  root.style.setProperty("--tg-button-neutral-bg", t.buttonNeutralBg);
  root.style.setProperty("--tg-button-neutral-border", t.buttonNeutralBorder);
  root.style.setProperty("--tg-button-neutral-shadow", t.buttonNeutralShadow);
  root.style.setProperty("--tg-button-neutral-text", t.buttonNeutralText);
  root.style.setProperty("--tg-video-overlay-bg", t.videoOverlayBg);
  root.style.setProperty("--tg-video-overlay-text", t.videoOverlayText);
  root.style.setProperty("--tg-video-subtitle-secondary", t.videoSubtitleSecondary);
  root.style.setProperty("--tg-media-bg", t.mediaBg);
  root.style.setProperty("--tg-highlight", t.highlight);
  root.style.setProperty("--tg-brand-blue", t.brandBlue);
  root.style.setProperty("--tg-brand-orange", t.brandOrange);
  root.style.setProperty("--tg-brand-purple", t.brandPurple);
  root.style.setProperty("--tg-brand-teal", t.brandTeal);
  root.style.setProperty("--tg-brand-green", t.brandGreen);
  root.style.setProperty("--tg-shadow-soft", t.shadowSoft);
  root.style.setProperty("--tg-shadow-strong", t.shadowStrong);
}
