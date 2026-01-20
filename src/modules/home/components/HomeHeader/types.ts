export type HomeHeaderProps = {
  streakDays: number;
  levelLabel: string | number;
  xpPoints: number;
  avatarUrl: string | null;
  displayName: string;
  initial: string;
  onOpenStreak: () => void;
  onOpenProfile: () => void;
};
