import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { Button } from '../../../shared/ui/Button';
import { Loader } from '../../../shared/ui/Loader';
import { selectAuth } from '../../auth/slice';
import { loadFeed, selectVideoFeed, toggleLike } from '../slice';
import { videoFeedApi } from '../api';
import type { TranscriptChunk, VideoContent, VideoFeedItem } from '../types';

type ContentState = {
  data?: VideoContent;
  loading?: boolean;
  error?: string;
};

const findChunkText = (chunks: TranscriptChunk[] | undefined, currentTime: number) => {
  if (!chunks || chunks.length === 0) return '';
  const match = chunks.find((chunk) => currentTime >= chunk.timestamp[0] && currentTime <= chunk.timestamp[1]);
  if (match) return match.text;
  const before = chunks
    .filter((chunk) => currentTime >= chunk.timestamp[0])
    .sort((a, b) => b.timestamp[0] - a.timestamp[0])[0];
  return before?.text ?? '';
};

function FeedVideoCard({
  item,
  contentState,
  onLoadContent,
  onLike,
  showOriginal,
  showTranslation,
  cardHeight,
  maxHeight,
  isActive,
  onVisibleChange,
  shouldLoad,
}: {
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
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [_, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tapIndicator, setTapIndicator] = useState<'play' | 'pause' | null>(null);
  const tapTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldLoad) {
      onLoadContent();
    }
  }, [onLoadContent, shouldLoad]);

  // Track visibility to decide active playback
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => onVisibleChange(item.id, entry.intersectionRatio));
      },
      { threshold: [0.5, 0.75, 0.9] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [item.id, onVisibleChange]);

  // Play/pause depending on active state
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => null);
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.muted = isMuted;
    }
  }, [isMuted]);

  const content = contentState.data;
  const enSub = showOriginal ? findChunkText(content?.transcription?.chunks, currentTime) : '';
  const ruSub = showTranslation ? findChunkText(content?.translation?.chunks, currentTime) : '';

  return (
    <div
      ref={cardRef}
      style={{
        position: 'relative',
        background: '#000',
        borderRadius: 0,
        overflow: 'hidden',
        height: cardHeight,
        maxHeight,
        width: '100%',
        scrollSnapAlign: 'start',
      }}
    >
      <video
        ref={videoRef}
        src={shouldLoad ? item.videoUrl : undefined}
        playsInline
        autoPlay={false}
        muted={isMuted}
        preload={shouldLoad ? 'metadata' : 'none'}
        onClick={() => {
          const el = videoRef.current;
          if (!el) return;
          if (el.paused) {
            el.play();
            setIsPlaying(true);
            setTapIndicator('play');
          } else {
            el.pause();
            setIsPlaying(false);
            setTapIndicator('pause');
          }
          if (tapTimeoutRef.current) {
            window.clearTimeout(tapTimeoutRef.current);
          }
          tapTimeoutRef.current = window.setTimeout(() => setTapIndicator(null), el.paused ? 0 : 500);
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          aspectRatio: '9 / 16',
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: 'calc(12px + var(--safe-right))',
          top: 'calc(12px + var(--safe-top))',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <Button
          variant="ghost"
          style={{ minWidth: 64, height: 48, padding: '10px 12px', borderRadius: 16, backdropFilter: 'blur(6px)' }}
          onClick={() => {
            setIsMuted((v) => {
              const el = videoRef.current;
              if (el) el.muted = !v;
              return !v;
            });
          }}
        >
          {isMuted ? '🔇' : '🔊'}
        </Button>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 'calc(12px + var(--safe-right))',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <Button
          variant={item.isLiked ? 'primary' : 'ghost'}
          style={{ minWidth: 72, height: 64, padding: '12px 14px', borderRadius: 18, backdropFilter: 'blur(6px)', fontSize: 20 }}
          onClick={() => onLike(item.id)}
        >
          ❤️ {content?.likesCount ?? item.likesCount}
        </Button>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 'calc(12px + var(--safe-top))',
          left: 'calc(12px + var(--safe-left))',
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        {item.analysis.topics.slice(0, 2).map((topic) => (
          <span key={topic} className="badge">
            {topic}
          </span>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '14px 16px calc(20px + var(--safe-bottom))',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.08) 100%)',
          color: '#fff',
          display: 'grid',
          gap: 6,
        }}
      >
        {(enSub || ruSub || contentState.loading) && (
          <div style={{ display: 'grid', gap: 4, marginBottom: 4 }}>
            {contentState.loading && <div style={{ color: '#cfd3e0', fontSize: 12 }}>Загружаем субтитры…</div>}
            {enSub && (
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 24,
                  textShadow: '0 2px 10px rgba(0,0,0,0.95)',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '8px 10px',
                  borderRadius: 10,
                  display: 'inline-block',
                  width: 'fit-content',
                }}
              >
                {enSub}
              </div>
            )}
            {ruSub && (
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 22,
                  color: '#d8e4ff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                  background: 'rgba(0,0,0,0.55)',
                  padding: '8px 10px',
                  borderRadius: 10,
                  display: 'inline-block',
                  width: 'fit-content',
                }}
              >
                {ruSub}
              </div>
            )}
          </div>
        )}

        {/* Custom controls */}
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ flex: 1, display: 'grid' }}>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                const el = videoRef.current;
                if (!el) return;
                const next = Number(e.target.value);
                el.currentTime = next;
                setCurrentTime(next);
              }}
              style={{ width: '100%' }}
            />
          </div>
          {tapIndicator && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 72,
                textShadow: '0 2px 16px rgba(0,0,0,0.9)',
              }}
            >
              {tapIndicator === 'play' ? '▶️' : '⏸'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function VideoFeed() {
  const dispatch = useAppDispatch();
  const feed = useAppSelector(selectVideoFeed);
  const auth = useAppSelector(selectAuth);

  const [showOriginal] = useState(true);
  const [showTranslation] = useState(true);
  const [contentMap, setContentMap] = useState<Record<string, ContentState>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (feed.items.length === 0) {
      dispatch(loadFeed({ reset: true }));
    }
  }, [feed.items.length, dispatch]);

  // If пользователь сменился (гость -> телега), перезагружаем ленту заново
  useEffect(() => {
    const currentUserId = auth.profile?.id ?? null;
    if (lastUserId.current === currentUserId) return;
    lastUserId.current = currentUserId;
    setContentMap({});
    setActiveId(null);
    dispatch(loadFeed({ reset: true }));
  }, [auth.profile?.id, dispatch]);

  useEffect(() => {
    if (activeId === null && feed.items.length > 0) {
      setActiveId(feed.items[0].id);
    }
  }, [feed.items.length, dispatch]);

  const loadContent = useCallback(
    async (videoId: string) => {
      const state = contentMap[videoId];
      if (state?.loading || state?.data) return;

      setContentMap((prev) => ({ ...prev, [videoId]: { ...prev[videoId], loading: true, error: undefined } }));
      try {
        const data = await videoFeedApi.getContent(auth.profile?.id ?? null, videoId, auth.profile?.role ?? null);
        setContentMap((prev) => ({ ...prev, [videoId]: { data, loading: false, error: undefined } }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось загрузить видео';
        setContentMap((prev) => ({ ...prev, [videoId]: { data: prev[videoId]?.data, loading: false, error: message } }));
      }
    },
    [auth.profile?.id, auth.profile?.role, contentMap],
  );

  const toggleLikeHandler = useCallback(
    (id: string) => {
      dispatch(toggleLike(id));
    },
    [dispatch],
  );

  const navOffset = 64; // navbar height approximation
  const cardHeight = `calc(100vh - ${navOffset}px - 2px)`;
  const maxHeight = cardHeight;
  const handleVisibleChange = useCallback((id: string, ratio: number) => {
    if (ratio >= 0.65) {
      setActiveId(id);
    }
  }, []);
  const isLoadingMore = feed.status === 'refreshing';

  useEffect(() => {
    if (!sentinelRef.current || !feed.hasMore) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoadingMore) {
            dispatch(loadFeed({ reset: false }));
          }
        });
      },
      { root: null, threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [dispatch, feed.hasMore, isLoadingMore]);

  const items = feed.items;
  const activeIndex = useMemo(() => items.findIndex((i) => i.id === activeId), [activeId, items]);

  return (
    <div style={{ height: `calc(100vh - ${navOffset}px)`, padding: 0 }}>
      {feed.status === 'loading' && <Loader />}
      {feed.error && (
        <div style={{ color: 'var(--tg-danger)', marginBottom: 8, fontWeight: 600 }}>
          {feed.error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gap: 0,
          height: `calc(100vh - ${navOffset}px)`,
          overflowY: 'auto',
          padding: 0,
          scrollSnapType: 'y mandatory',
        }}
      >
        {items.map((item, index) => {
          const isActive = activeId ? activeId === item.id : index === 0;
          const isNext = index === (activeIndex >= 0 ? activeIndex + 1 : 1);
          const shouldLoad = isActive || isNext;
          return (
            <FeedVideoCard
              key={item.id}
              item={item}
              contentState={contentMap[item.id] ?? {}}
              onLoadContent={() => loadContent(item.id)}
              onLike={toggleLikeHandler}
              showOriginal={showOriginal}
              showTranslation={showTranslation}
              cardHeight={cardHeight}
              maxHeight={maxHeight}
              isActive={isActive}
              onVisibleChange={handleVisibleChange}
              shouldLoad={shouldLoad}
            />
          );
        })}
        {feed.hasMore && (
          <div ref={sentinelRef} style={{ height: 12, width: '100%' }}>
            {isLoadingMore && <Loader />}
          </div>
        )}
      </div>

      {feed.hasMore && (
        <div style={{ marginTop: 8, textAlign: 'center', color: 'var(--tg-subtle)', fontSize: 12 }}>
          Прокручивайте вниз, лента подгружается автоматически
        </div>
      )}
    </div>
  );
}
