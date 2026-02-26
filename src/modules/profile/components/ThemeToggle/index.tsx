import { Icon } from "../../../../shared/ui/Icon";
import type { ThemeToggleProps } from "./types";
import { ToggleButton, ToggleThumb, ToggleTrack } from "./styles";

export function ThemeToggle({ themeMode, systemTheme, onToggle }: ThemeToggleProps) {
  const isDark =
    themeMode === "dark" || (themeMode === "system" && systemTheme === "dark");
  const activeColor = isDark ? "var(--tg-accent-strong)" : "var(--tg-warning)";

  return (
    <ToggleButton
      type="button"
      onClick={onToggle}
      aria-label="Переключить тему"
      title="Переключить тему"
    >
      <ToggleTrack>
        <ToggleThumb $active={!isDark} $activeColor={activeColor}>
          <Icon name="sun" size={18} color={isDark ? "var(--tg-subtle)" : "var(--tg-text-on-accent)"} />
        </ToggleThumb>
        <ToggleThumb $active={isDark} $activeColor={activeColor}>
          <Icon name="moon" size={18} color={isDark ? "var(--tg-text-on-accent)" : "var(--tg-subtle)"} />
        </ToggleThumb>
      </ToggleTrack>
    </ToggleButton>
  );
}
