import { useSearchParams } from "react-router-dom";
import { VideoFeed } from "../features/video-feed/components/video-feed";
import { PageShell } from "../shared/ui/PageShell";

export default function VideoPage() {
  const [params] = useSearchParams();
  const contentId = params.get("contentId");

  return (
    <PageShell scroll={false}>
      <VideoFeed initialContentId={contentId} />
    </PageShell>
  );
}
