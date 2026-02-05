import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { Loader } from '../../../../shared/ui/Loader';
import type { SnippetCardProps } from './types';
import {
  CardPlaceholder,
  CardShell,
  ContextText,
  ContextWrapper,
  FullVideoButton,
  Highlight,
  LoadingOverlay,
  PlayButton,
  PlayIcon,
  Video,
} from './styles';

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildTokenPattern = (token: string) => {
  const normalized = token.replace(/['’]/g, '');
  if (!normalized) return '';
  const chars = normalized.split('').map(escapeRegExp);
  return `\\b${chars.join("['’]?")}\\b`;
};

const createHighlightRegex = (value: string): RegExp | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed
    .split(/\s+/)
    .map(buildTokenPattern)
    .filter(Boolean);
  if (!parts.length) return null;
  const pattern = parts.join('\\s+');
  return new RegExp(pattern, 'gi');
};

const buildHighlightedText = (text: string, highlight: string): ReactNode => {
  const regex = createHighlightRegex(highlight);
  if (!regex) return text;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(<Highlight key={`hl-${key++}`}>{match[0]}</Highlight>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : text;
};

export function SnippetCard({
  snippet,
  isActive,
  shouldRender,
  highlight,
  onOpenFullVideo,
  compact = false,
}: SnippetCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!shouldRender) {
      setIsPlaying(false);
      setIsReady(false);
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    if (!isActive) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    if (isReady) {
      const safeStart = snippet.startSeconds;
      const safeEnd = snippet.endSeconds;
      if (video.currentTime < safeStart || video.currentTime > safeEnd) {
        video.currentTime = safeStart;
      }
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isActive, isReady, shouldRender, snippet.endSeconds, snippet.id, snippet.startSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isActive) {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      if (Math.abs(video.currentTime - snippet.startSeconds) > 0.4) {
        video.currentTime = snippet.startSeconds;
      }
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [snippet.startSeconds]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isActive) {
      video.pause();
      setIsPlaying(false);
      return;
    }
    if (video.currentTime >= snippet.endSeconds) {
      video.currentTime = snippet.startSeconds;
      if (isActive) {
        video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    }
  }, [isActive, snippet.endSeconds, snippet.startSeconds]);

  if (!shouldRender) {
    return <CardPlaceholder className="page-header" $compact={compact} />;
  }

  return (
    <CardShell $compact={compact}>
      <FullVideoButton
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpenFullVideo(snippet);
        }}
      >
        Полное видео
      </FullVideoButton>
      <Video
        ref={videoRef}
        src={snippet.videoUrl}
        playsInline
        preload="metadata"
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          video.currentTime = snippet.startSeconds;
          setIsReady(true);
          if (isActive) {
            video.play().catch(() => undefined);
          }
        }}
        onTimeUpdate={handleTimeUpdate}
      />
      {snippet.contextText && (
        <ContextWrapper>
          <ContextText>{buildHighlightedText(snippet.contextText, highlight)}</ContextText>
        </ContextWrapper>
      )}
      <PlayButton type="button" onClick={handleTogglePlay} aria-label={isPlaying ? 'Пауза' : 'Проиграть'}>
        {!isPlaying && <PlayIcon>▶</PlayIcon>}
      </PlayButton>
      {!isReady && (
        <LoadingOverlay>
          <Loader />
        </LoadingOverlay>
      )}
    </CardShell>
  );
}
