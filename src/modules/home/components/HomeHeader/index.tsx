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
          color="#F97316"
          fillColor="#442D22"
        />
        <StreakCount>{streakDays}</StreakCount>
      </StreakButton>
    </HeaderRow>
  );
}
