import { Icon } from '../../../../shared/ui/Icon';
import type { ProfileSummaryProps } from './types';
import {
  Actions,
  Avatar,
  AvatarImage,
  Badge,
  BadgeSubtle,
  Card,
  IconButton,
  Name,
  ProfileRow,
} from './styles';

export function ProfileSummary({
  fullName,
  role,
  avatarUrl,
  initials,
  xpPoints,
  levelLabel,
  isTelegramUser,
  onLogout,
  children,
}: ProfileSummaryProps) {
  return (
    <Card>
      <ProfileRow>
        <Avatar $isAdmin={role === 'admin'}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : initials || 'U'}
        </Avatar>

        <div>
          <Name>{fullName}</Name>
          <Badge>
            <Icon name="exercise" size={16} color="#4cc4ff" />
            <span>Ур. {levelLabel}</span>
            <BadgeSubtle>{xpPoints} XP</BadgeSubtle>
          </Badge>
        </div>

        <Actions>
          {!isTelegramUser && (
            <IconButton type="button" onClick={onLogout} aria-label="Выйти" title="Выйти">
              <Icon name="logout" size={18} />
            </IconButton>
          )}
          {children}
        </Actions>
      </ProfileRow>
    </Card>
  );
}
