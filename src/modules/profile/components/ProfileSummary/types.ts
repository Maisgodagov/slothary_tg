import type { ReactNode } from "react";

export type ProfileSummaryProps = {
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  initials: string;
  xpPoints: number;
  levelLabel: string | number;
  isTelegramUser: boolean;
  onLogout: () => void;
  children?: ReactNode;
};
