import type { ReactNode } from "react";

export type ProfileSummaryProps = {
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  initials: string;
  xpPoints: number;
  levelLabel: string | number;
  streakDays: number;
  wordsLearned: number;
  isTelegramUser: boolean;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  onContact?: () => void;
  onOpenWordProgress?: () => void;
  children?: ReactNode;
};
