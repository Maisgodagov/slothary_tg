import { useEffect, useRef, useState } from 'react';

import { Icon } from '../../../../shared/ui/Icon';
import type { SnippetPlayerProps } from './types';
import { PlayerShell, PlayerVideo, ReplayOverlay } from './styles';

export function SnippetPlayer({ snippet }: SnippetPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (video.currentTime >= snippet.endSeconds) {
        video.pause();
        setEnded(true);
      }
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [snippet.endSeconds, snippet.startSeconds]);

  return (
    <PlayerShell>
      <PlayerVideo
        ref={videoRef}
        src={snippet.videoUrl}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          video.currentTime = snippet.startSeconds;
          video.play().catch(() => undefined);
          setEnded(false);
        }}
        onClick={() => {
          const video = videoRef.current;
          if (!video) return;
          if (!video.paused) {
            video.pause();
            return;
          }
          video.currentTime = snippet.startSeconds;
          video.play().catch(() => undefined);
          setEnded(false);
        }}
        onPlay={() => setEnded(false)}
        controls={false}
        playsInline
        muted={false}
      />
      {ended && (
        <ReplayOverlay
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = snippet.startSeconds;
            video.play().catch(() => undefined);
            setEnded(false);
          }}
        >
          <Icon name="replay" size={44} color="#fff" />
        </ReplayOverlay>
      )}
    </PlayerShell>
  );
}
