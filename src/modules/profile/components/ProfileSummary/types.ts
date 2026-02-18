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
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  onCefrLevelChange: (level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => void;
  savingCefrLevel: boolean;
  children?: ReactNode;
};
