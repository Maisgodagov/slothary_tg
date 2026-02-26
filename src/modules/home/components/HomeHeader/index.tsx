import { Icon } from "../../../../shared/ui/Icon";
import type { HomeHeaderProps } from "./types";
import {
  AvatarImage,
  AvatarInitial,
  HeaderRow,
  HeaderCard,
  HeaderText,
  Greeting,
  Subline,
  StreakButton,
  StreakCount,
  AvatarWrap,
} from "./styles";

export function HomeHeader({
  streakDays,
  levelLabel,
  xpPoints,
  avatarUrl,
  displayName,
  initial,
  isLightTheme,
  onOpenStreak,
  onOpenProfile,
}: HomeHeaderProps) {
  return (
    <HeaderRow className="page-header">
      <HeaderCard type="button" onClick={onOpenProfile}>
        <AvatarWrap>
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName} />
          ) : (
            <AvatarInitial>{initial}</AvatarInitial>
          )}
        </AvatarWrap>
        <HeaderText>
          <Greeting>Привет, {displayName}!</Greeting>
          <Subline>
            <span>Level {levelLabel}</span>
            <span>•</span>
            <span>{xpPoints} XP</span>
          </Subline>
        </HeaderText>
      </HeaderCard>

      <StreakButton type="button" onClick={onOpenStreak}>
        <Icon
          name="flame-filled"
          size={24}
          color="var(--tg-warning)"
          fillColor={
            isLightTheme
              ? "color-mix(in srgb, var(--tg-warning) 48%, var(--tg-card-strong) 52%)"
              : "color-mix(in srgb, var(--tg-warning) 24%, var(--tg-bg) 76%)"
          }
        />
        <StreakCount>{streakDays}</StreakCount>
      </StreakButton>
    </HeaderRow>
  );
}
