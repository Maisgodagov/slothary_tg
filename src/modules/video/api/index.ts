import { videoFeedApi } from '../../../features/video-feed/api';

export const videoApi = {
  getFeed: videoFeedApi.getFeed,
  getContent: videoFeedApi.getContent,
  updateLike: videoFeedApi.updateLike,
};
