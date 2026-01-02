import type { CSSProperties } from "react";
import {
  Home,
  Book,
  Heart,
  Volume2,
  VolumeX,
  Play,
  Pause,
  PlayCircle,
  MoreVertical,
  X,
  Brain,
  Settings,
  UserRound,
} from "lucide-react";

type IconName =
  | "home"
  | "home-filled"
  | "dictionary"
  | "dictionary-filled"
  | "profile"
  | "admin"
  | "like"
  | "like-outline"
  | "volume-on"
  | "volume-off"
  | "play"
  | "pause"
  | "video"
  | "video-filled"
  | "more"
  | "close"
  | "exercise"
  | "exercise-filled";

const ICON_MAP: Record<
  IconName,
  React.ComponentType<{
    size?: number;
    color?: string;
    style?: CSSProperties;
    strokeWidth?: number;
    fill?: string;
  }>
> = {
  home: Home,
  "home-filled": Home,
  dictionary: Book,
  "dictionary-filled": Book,
  profile: UserRound,
  admin: Settings,
  like: Heart,
  "like-outline": Heart,
  "volume-on": Volume2,
  "volume-off": VolumeX,
  play: Play,
  pause: Pause,
  video: PlayCircle,
  "video-filled": PlayCircle,
  more: MoreVertical,
  close: X,
  exercise: Brain,
  "exercise-filled": Brain,
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 20, color = "currentColor", style }: IconProps) {
  const Component = ICON_MAP[name];
  if (!Component) return null;

  const filled = name.endsWith("filled") || name === "like";
  const fill = filled ? color : "none";

  return (
    <Component
      size={size}
      color={color}
      strokeWidth={2}
      fill={fill}
      style={style}
    />
  );
}
