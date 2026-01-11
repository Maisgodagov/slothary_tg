import type { VideoContent, VideoFeedItem } from "../../types";
import type { SpeechSpeedFilter } from "../../slice";

export type ContentState = {
  data?: VideoContent;
  loading?: boolean;
  error?: string;
};

export interface VideoCardProps {
  item: VideoFeedItem;
  contentState: ContentState;
  onLoadContent: () => void;
  onLike: (id: string) => void;
  showOriginal: boolean;
  showTranslation: boolean;
  cardHeight: string;
  maxHeight: string;
  isActive: boolean;
  onVisibleChange: (id: string, ratio: number) => void;
  shouldLoad: boolean;
  onOpenSettings: () => void;
  onOpenLevelFilter?: (level: string | null) => void;
  selectedLevelFilters?: string[] | null;
  onOpenSpeedFilter?: (speed: SpeechSpeedFilter | null) => void;
  selectedSpeedFilters?: SpeechSpeedFilter[] | null;
  onExercisesToggle?: (open: boolean) => void;
  registerRef?: (node: HTMLDivElement | null) => void;
}
