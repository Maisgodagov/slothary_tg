import type { VideoContent, VideoFeedItem } from "../../types";

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
}
