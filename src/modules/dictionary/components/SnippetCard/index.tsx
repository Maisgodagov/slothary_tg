import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { dictionaryApi } from '../../../../features/dictionary/api';
import { WordCard } from '../../../../features/dictionary/components/WordCard';
import { muellerApi, type MuellerEntry } from '../../../../features/mueller/api';
import { Loader } from '../../../../shared/ui/Loader';
import type { SnippetCardProps } from './types';
import {
  CardPlaceholder,
  CardShell,
  ContextText,
  ContextWordButton,
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
  const [subtitleLookup, setSubtitleLookup] = useState<{
    word: string;
    status: 'idle' | 'loading' | 'ready' | 'error';
    entry?: MuellerEntry;
    error?: string;
  } | null>(null);
  const [subtitlePopover, setSubtitlePopover] = useState<{
    top: number;
    left: number;
    width: number;
    placement: 'top' | 'bottom';
  } | null>(null);
  const subtitleWasPlayingRef = useRef(false);

  const resolveUserId = () => {
    try {
      const fromStorage = localStorage.getItem('guestUserId');
      if (fromStorage) return fromStorage;
      const newId = crypto.randomUUID();
      localStorage.setItem('guestUserId', newId);
      return newId;
    } catch {
      return `guest-${Math.random().toString(36).slice(2, 10)}`;
    }
  };

  useEffect(() => {
    if (!shouldRender) {
      setIsPlaying(false);
      setIsReady(false);
      setSubtitleLookup(null);
      setSubtitlePopover(null);
      subtitleWasPlayingRef.current = false;
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
      setSubtitleLookup(null);
      setSubtitlePopover(null);
      subtitleWasPlayingRef.current = false;
    }
  }, [isActive]);

  useEffect(() => {
    setSubtitleLookup(null);
    setSubtitlePopover(null);
    subtitleWasPlayingRef.current = false;
  }, [snippet.id, snippet.contextText]);

  useEffect(() => {
    if (subtitlePopover) return;
    if (!subtitleWasPlayingRef.current) return;
    subtitleWasPlayingRef.current = false;
    const video = videoRef.current;
    if (video && video.paused && isActive) {
      video.play().catch(() => undefined);
    }
  }, [isActive, subtitlePopover]);

  useEffect(() => {
    if (!subtitlePopover) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-subtitle-popover]')) return;
      setSubtitlePopover(null);
      setSubtitleLookup(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [subtitlePopover]);

  useEffect(() => {
    if (!subtitlePopover) return;
    const handleScroll = () => {
      setSubtitlePopover(null);
      setSubtitleLookup(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('touchmove', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, [subtitlePopover]);

  const englishTokens = snippet.contextText
    ? (snippet.contextText.match(/([A-Za-z']+|[^A-Za-z']+)/g) ?? []).map(
        (part, index) => ({
          value: part,
          isWord: /^[A-Za-z']+$/.test(part),
          key: `${part}-${index}`,
        }),
      )
    : [];

  const handleSubtitleWordClick = useCallback(async (word: string, rect: DOMRect) => {
    const normalized = word.toLowerCase();
    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    const popoverWidth = Math.min(280, viewportWidth * 0.88);
    const margin = 12;
    const centeredLeft = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      viewportWidth - margin - popoverWidth / 2,
      Math.max(margin + popoverWidth / 2, centeredLeft),
    );
    const estimatedHeight = 200;
    let placement: 'top' | 'bottom' = 'top';
    if (rect.top < estimatedHeight + margin) placement = 'bottom';
    if (
      placement === 'bottom' &&
      rect.bottom + estimatedHeight + margin > viewportHeight
    ) {
      placement = 'top';
    }
    const top = placement === 'top' ? rect.top - 8 : rect.bottom + 8;

    const video = videoRef.current;
    if (video && !video.paused) {
      subtitleWasPlayingRef.current = true;
      video.pause();
      setIsPlaying(false);
    }

    setSubtitlePopover({
      top,
      left: clampedLeft,
      width: popoverWidth,
      placement,
    });
    setSubtitleLookup({ word: normalized, status: 'loading' });

    try {
      const entries = await muellerApi.lookup({ word: normalized, lang: 'en' });
      const primary = entries[0];
      setSubtitleLookup({
        word: normalized,
        status: 'ready',
        entry: primary,
      });

      if (primary?.word && primary.translations?.[0]) {
        dictionaryApi
          .recordView(resolveUserId(), {
            query: normalized,
            lang: 'en',
            word: primary.word,
            translation: primary.translations[0],
          })
          .catch(() => null);
      }
    } catch (err: any) {
      setSubtitleLookup({
        word: normalized,
        status: 'error',
        error: err?.message ?? 'Failed to load translation.',
      });
    }
  }, []);

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
        onClick={(event) => {
          event.stopPropagation();
          handleTogglePlay();
        }}
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
          <ContextText>
            {englishTokens.map((token) =>
              token.isWord ? (
                <ContextWordButton
                  key={token.key}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                    handleSubtitleWordClick(token.value, rect);
                  }}
                >
                  {buildHighlightedText(token.value, highlight)}
                </ContextWordButton>
              ) : (
                <span key={token.key}>{buildHighlightedText(token.value, highlight)}</span>
              ),
            )}
          </ContextText>
        </ContextWrapper>
      )}
      <PlayButton type="button" aria-label={isPlaying ? 'Пауза' : 'Проиграть'}>
        {!isPlaying && <PlayIcon>▶</PlayIcon>}
      </PlayButton>
      {!isReady && (
        <LoadingOverlay>
          <Loader />
        </LoadingOverlay>
      )}
      {subtitlePopover &&
        createPortal(
          <div
            data-subtitle-popover
            style={{
              position: 'fixed',
              left: subtitlePopover.left,
              top: subtitlePopover.top,
              transform:
                subtitlePopover.placement === 'top'
                  ? 'translate(-50%, -100%)'
                  : 'translate(-50%, 0)',
              zIndex: 10000,
              width: 'max-content',
              maxWidth: `${subtitlePopover.width}px`,
              minWidth: '112px',
              pointerEvents: 'auto',
              fontFamily: 'inherit',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {subtitleLookup?.status === 'loading' && (
              <div
                style={{
                  background: 'var(--tg-surface)',
                  border: '1px solid var(--tg-border)',
                  borderRadius: 20,
                  padding: 6,
                  display: 'grid',
                  placeItems: 'center',
                  minHeight: 44,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: '3px solid rgba(109, 211, 255, 0.28)',
                    borderTopColor: 'var(--tg-accent-strong)',
                    animation: 'dictionary-mini-spin 0.9s linear infinite',
                  }}
                />
                <style>
                  {`@keyframes dictionary-mini-spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}
                </style>
              </div>
            )}
            {subtitleLookup?.status === 'error' && (
              <div
                style={{
                  background: 'var(--tg-surface)',
                  border: '1px solid var(--tg-border)',
                  borderRadius: 14,
                  padding: 12,
                  color: 'var(--tg-danger)',
                  fontSize: 13,
                }}
              >
                {subtitleLookup.error}
              </div>
            )}
            {subtitleLookup?.status === 'ready' &&
              subtitleLookup.entry &&
              (() => {
                const entry = subtitleLookup.entry;
                const translation =
                  entry.translations.find((value) => value.trim().length > 0) ?? '';
                return (
                  <WordCard
                    word={entry.word}
                    translation={translation}
                    showExamplesButton={false}
                    examplesOpen={false}
                    onToggleExamples={() => undefined}
                    dictionaryActionMode="none"
                    variant="compact"
                    size="subtitle"
                  />
                );
              })()}
          </div>,
          document.body,
        )}
    </CardShell>
  );
}
