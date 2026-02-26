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
  TopRow,
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
  cefrLevel,
  onCefrLevelChange,
  savingCefrLevel,
  children,
}: ProfileSummaryProps) {
  const displayName = fullName || "Профиль";
  const achievements = 0;
  const savedVideos = 0;

  return (
    <Card>
      <TopRow>
        <Actions $align="start" $justify="start">
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
        </Actions>

        <AvatarRing>
          <Avatar>
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : (
              initials || "U"
            )}
          </Avatar>
        </AvatarRing>

        <Actions $align="start" $justify="end">
          {children}
        </Actions>
      </TopRow>

      <CenterBlock>
        <LevelPill>ур. {levelLabel}</LevelPill>
        <Name>{displayName}</Name>
        <Subline>{xpPoints} XP</Subline>
      </CenterBlock>

      <StatsGrid>
        <StatCard as="div">
          <StatIcon>
            <Icon name="flame" size={22} color="var(--tg-warning)" />
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
            <Icon name="dictionary" size={22} color="var(--tg-accent-strong)" />
          </StatIcon>
          <StatValue>{wordsLearned}</StatValue>
          <StatLabel>слов выучено</StatLabel>
        </StatCard>
        <StatCard as="div">
          <StatIcon>
            <Icon name="video" size={22} color="var(--tg-accent)" />
          </StatIcon>
          <StatValue>{savedVideos}</StatValue>
          <StatLabel>сохраненные видео</StatLabel>
        </StatCard>
        <StatCard as="div">
          <StatIcon>
            <Icon name="trophy" size={22} color="var(--tg-highlight)" />
          </StatIcon>
          <StatValue>{achievements}</StatValue>
          <StatLabel>достижений</StatLabel>
        </StatCard>
      </StatsGrid>

      <SettingsSection>
        <SettingsTitle>Дополнительно</SettingsTitle>
        <SettingsList>
          <SettingsItem as="div">
            <SettingsLeft>
              <SettingsIcon>
                <Icon name="profile" size={18} />
              </SettingsIcon>
              <SettingsText>Уровень английского</SettingsText>
            </SettingsLeft>
            <select
              value={cefrLevel}
              onChange={(event) =>
                onCefrLevelChange(event.target.value as "A1" | "A2" | "B1" | "B2" | "C1" | "C2")
              }
              disabled={savingCefrLevel}
              style={{
                height: 34,
                borderRadius: 10,
                border: "1px solid var(--tg-border)",
                background: "var(--tg-surface)",
                color: "var(--tg-text)",
                padding: "0 10px",
                fontWeight: 700,
                minWidth: 86,
              }}
            >
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </SettingsItem>

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
