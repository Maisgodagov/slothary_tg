export type ThemeToggleProps = {
  themeMode: 'light' | 'dark' | 'system';
  systemTheme: 'light' | 'dark';
  onToggle: () => void;
};
