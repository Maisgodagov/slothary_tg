import type { CSSProperties } from "react";
import {
  IoBookOutline,
  IoHeart,
  IoHeartOutline,
  IoHomeOutline,
  IoPersonCircleOutline,
  IoSettingsOutline,
  IoVolumeHigh,
  IoVolumeMute,
  IoPlay,
  IoPause,
  IoPlayCircleOutline,
  IoEllipsisVertical,
} from "react-icons/io5";

type IconName =
  | "home"
  | "dictionary"
  | "profile"
  | "admin"
  | "like"
  | "like-outline"
  | "volume-on"
  | "volume-off"
  | "play"
  | "pause"
  | "video"
  | "more";

const ICON_MAP: Record<IconName, React.ComponentType<{ size?: number; color?: string; style?: CSSProperties }>> = {
  home: IoHomeOutline,
  dictionary: IoBookOutline,
  profile: IoPersonCircleOutline,
  admin: IoSettingsOutline,
  like: IoHeart,
  "like-outline": IoHeartOutline,
  "volume-on": IoVolumeHigh,
  "volume-off": IoVolumeMute,
  play: IoPlay,
  pause: IoPause,
  video: IoPlayCircleOutline,
  more: IoEllipsisVertical,
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
