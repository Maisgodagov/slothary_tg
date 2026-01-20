import { Icon } from "../../../../shared/ui/Icon";
import type { ProfileSummaryProps } from "./types";
import {
  Actions,
  Avatar,
  AvatarImage,
  AvatarRing,
  Card,
  CenterBlock,
  IconButton,
  LevelPill,
  Name,
  SettingsIcon,
  SettingsItem,
  SettingsLeft,
  SettingsList,
  SettingsRight,
  SettingsSection,
  SettingsText,
  SettingsTitle,
  StatCard,
  StatIcon,
  StatLabel,
  StatValue,
  StatsGrid,
  Subline,
  TopBar,
} from "./styles";

export function ProfileSummary({
  fullName,
  role,
  avatarUrl,
  initials,
  xpPoints,
  levelLabel,
  streakDays,
  wordsLearned,
  isTelegramUser,
  onLogout,
  onOpenAdmin,
  onContact,
  onOpenWordProgress,
  children,
}: ProfileSummaryProps) {
  const displayName = fullName || "Профиль";
  const achievements = 0;
  const savedVideos = 0;

  return (
    <Card>
      <TopBar>
        <Actions>
          {!isTelegramUser && (
            <IconButton
              type="button"
              onClick={onLogout}
              aria-label="Выйти"
              title="Выйти"
            >
              <Icon name="logout" size={18} />
            </IconButton>
          )}
          {children}
        </Actions>
      </TopBar>

      <CenterBlock>
        <AvatarRing>
          <Avatar>
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : (
              initials || "U"
            )}
          </Avatar>
        </AvatarRing>
        <LevelPill>ур. {levelLabel}</LevelPill>
        <Name>{displayName}</Name>
        <Subline>{xpPoints} XP</Subline>
      </CenterBlock>

      <StatsGrid>
        <StatCard as="div">
          <StatIcon>
            <Icon name="flame" size={22} color="#ff9f45" />
          </StatIcon>
          <StatValue>{streakDays}</StatValue>
          <StatLabel>дни подряд</StatLabel>
        </StatCard>
        <StatCard
          type="button"
          onClick={onOpenWordProgress}
          $clickable={Boolean(onOpenWordProgress)}
        >
          <StatIcon>
            <Icon name="dictionary" size={22} color="#5ab0ff" />
          </StatIcon>
          <StatValue>{wordsLearned}</StatValue>
          <StatLabel>слов выучено</StatLabel>
        </StatCard>
        <StatCard as="div">
          <StatIcon>
            <Icon name="video" size={22} color="#9b87ff" />
          </StatIcon>
          <StatValue>{savedVideos}</StatValue>
          <StatLabel>сохраненные видео</StatLabel>
        </StatCard>
        <StatCard as="div">
          <StatIcon>
            <Icon name="trophy" size={22} color="#f3c44a" />
          </StatIcon>
          <StatValue>{achievements}</StatValue>
          <StatLabel>достижений</StatLabel>
        </StatCard>
      </StatsGrid>

      <SettingsSection>
        <SettingsTitle>Настройки аккаунта</SettingsTitle>
        <SettingsList>
          {role === "admin" && (
            <SettingsItem type="button" onClick={onOpenAdmin}>
              <SettingsLeft>
                <SettingsIcon>
                  <Icon name="admin" size={18} />
                </SettingsIcon>
                <SettingsText>Админка</SettingsText>
              </SettingsLeft>
              <SettingsRight>›</SettingsRight>
            </SettingsItem>
          )}
          <SettingsItem type="button" onClick={onContact}>
            <SettingsLeft>
              <SettingsIcon>
                <Icon name="edit" size={18} />
              </SettingsIcon>
              <SettingsText>Связаться с нами</SettingsText>
            </SettingsLeft>
            <SettingsRight>›</SettingsRight>
          </SettingsItem>
        </SettingsList>
      </SettingsSection>
    </Card>
  );
}
