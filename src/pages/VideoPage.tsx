import { useSearchParams } from "react-router-dom";
import { VideoFeed } from "../features/video-feed/components/video-feed";

export default function VideoPage() {
  const [params] = useSearchParams();
  const contentId = params.get("contentId");

  return (
    <div style={{ width: "100vw", padding: 0, margin: 0 }}>
      <VideoFeed initialContentId={contentId} />
    </div>
  );
}
