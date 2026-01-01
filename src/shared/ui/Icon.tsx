import type { CSSProperties } from "react";
import {
  IoBookOutline,
  IoBook,
  IoHeart,
  IoHeartOutline,
  IoHomeOutline,
  IoHome,
  IoPersonCircleOutline,
  IoSettingsOutline,
  IoVolumeHigh,
  IoVolumeMute,
  IoPlay,
  IoPause,
  IoPlayCircleOutline,
  IoPlayCircle,
  IoEllipsisVertical,
  IoClose,
} from "react-icons/io5";

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
  | "close";

const ICON_MAP: Record<IconName, React.ComponentType<{ size?: number; color?: string; style?: CSSProperties }>> = {
  home: IoHomeOutline,
  "home-filled": IoHome,
  dictionary: IoBookOutline,
  "dictionary-filled": IoBook,
  profile: IoPersonCircleOutline,
  admin: IoSettingsOutline,
  like: IoHeart,
  "like-outline": IoHeartOutline,
  "volume-on": IoVolumeHigh,
  "volume-off": IoVolumeMute,
  play: IoPlay,
  pause: IoPause,
  video: IoPlayCircleOutline,
  "video-filled": IoPlayCircle,
  more: IoEllipsisVertical,
  close: IoClose,
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
  return <Component size={size} color={color} style={style} />;
}
