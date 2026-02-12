import type { CSSProperties } from "react";
import {
  Home,
  Book,
  BookOpen,
  Bookmark,
  Heart,
  Volume2,
  VolumeX,
  Play,
  Pause,
  PlayCircle,
  MoreVertical,
  X,
  LogOut,
  Brain,
  Trophy,
  Languages,
  Settings,
  UserRound,
  Edit3,
  Search,
  ArrowLeft,
  ChevronDown,
  Sun,
  Moon,
  Flame,
  History,
  RotateCcw,
  Repeat2,
  Type,
  CaseSensitive,
  Share2,
  Forward,
  Plus,
  Check,
  Trash2,
} from "lucide-react";

type IconName =
  | "home"
  | "home-filled"
  | "dictionary"
  | "dictionary-filled"
  | "reading"
  | "reading-filled"
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
  | "logout"
  | "exercise"
  | "exercise-filled"
  | "edit"
  | "search"
  | "back"
  | "chevron-down"
  | "sun"
  | "moon"
  | "flame"
  | "flame-filled"
  | "history"
  | "replay"
  | "repost"
  | "trophy"
  | "translate"
  | "bookmark"
  | "share"
  | "font"
  | "case-sensitive"
  | "forward"
  | "plus"
  | "check"
  | "trash";

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
  reading: BookOpen,
  "reading-filled": BookOpen,
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
  logout: LogOut,
  exercise: Brain,
  "exercise-filled": Brain,
  edit: Edit3,
  search: Search,
  back: ArrowLeft,
  "chevron-down": ChevronDown,
  sun: Sun,
  moon: Moon,
  flame: Flame,
  "flame-filled": Flame,
  history: History,
  replay: RotateCcw,
  repost: Repeat2,
  trophy: Trophy,
  translate: Languages,
  bookmark: Bookmark,
  share: Share2,
  font: Type,
  "case-sensitive": CaseSensitive,
  forward: Forward,
  plus: Plus,
  check: Check,
  trash: Trash2,
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
  fillColor?: string;
}

export function Icon({
  name,
  size = 20,
  color = "currentColor",
  style,
  fillColor = "currentColor",
}: IconProps) {
  const Component = ICON_MAP[name];
  if (!Component) return null;

  const filled = name.endsWith("filled") || name === "like";
  const fill = filled ? fillColor : "none";

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
