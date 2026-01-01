import { VideoFeed } from "../features/video-feed/components/video-feed";

export default function HomePage() {
  return (
    <div style={{ height: "100vh", width: "100vw", padding: 0, margin: 0 }}>
      <VideoFeed />
    </div>
  );
}
