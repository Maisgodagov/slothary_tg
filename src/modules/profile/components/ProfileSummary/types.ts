import type { ReactNode } from 'react';

export type ProfileSummaryProps = {
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  initials: string;
  xpPoints: number;
  levelLabel: string;
  isTelegramUser: boolean;
  onLogout: () => void;
  children?: ReactNode;
};
