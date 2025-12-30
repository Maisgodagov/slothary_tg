import { useCallback, useEffect, useState } from 'react';
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
}: {
  item: VideoFeedItem;
  contentState: ContentState;
  onLoadContent: () => void;
  onLike: (id: string) => void;
  showOriginal: boolean;
  showTranslation: boolean;
}) {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    onLoadContent();
  }, [onLoadContent]);

  const content = contentState.data;
  const enSub = showOriginal ? findChunkText(content?.transcription?.chunks, currentTime) : '';
  const ruSub = showTranslation ? findChunkText(content?.translation?.chunks, currentTime) : '';

  return (
    <div
      style={{
        position: 'relative',
        background: '#000',
        borderRadius: 16,
        overflow: 'hidden',
        height: '100%',
        scrollSnapAlign: 'start',
      }}
    >
      <video
        src={item.videoUrl}
        controls
        playsInline
        muted
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <Button
          variant={item.isLiked ? 'primary' : 'ghost'}
          style={{ minWidth: 90, backdropFilter: 'blur(6px)' }}
          onClick={() => onLike(item.id)}
        >
          ❤️ {content?.likesCount ?? item.likesCount}
        </Button>
      </div>

      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {item.analysis.topics.slice(0, 2).map((topic) => (
          <span key={topic} className="badge">
            {topic}
          </span>
        ))}
      </div>

      {(enSub || ruSub || contentState.loading) && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '16px 18px 24px',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 100%)',
            color: '#fff',
            display: 'grid',
            gap: 6,
          }}
        >
          {contentState.loading && <div style={{ color: '#cfd3e0', fontSize: 12 }}>Загружаем субтитры…</div>}
          {enSub && (
            <div style={{ fontWeight: 700, fontSize: 16, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{enSub}</div>
          )}
          {ruSub && (
            <div style={{ fontWeight: 600, fontSize: 14, color: '#d8e4ff', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
              {ruSub}
            </div>
          )}
        </div>
      )}
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

  useEffect(() => {
    if (feed.items.length === 0) {
      dispatch(loadFeed({ reset: true }));
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

  const statusBadge = auth.profile ? 'Аккаунт' : 'Гость';
  const navOffset = 72; // approximate navbar height

  return (
    <div style={{ height: `calc(100vh - ${navOffset}px)`, padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 2px 8px' }}>
        <span className="badge">{statusBadge}</span>
        <Button variant="ghost" onClick={() => dispatch(loadFeed({ reset: true }))}>
          Обновить
        </Button>
      </div>

      {feed.status === 'loading' && <Loader />}
      {feed.error && (
        <div style={{ color: 'var(--tg-danger)', marginBottom: 8, fontWeight: 600 }}>
          {feed.error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gap: 18,
          height: `calc(100vh - ${navOffset}px - 36px)`,
          overflowY: 'scroll',
          paddingRight: 0,
          scrollSnapType: 'y mandatory',
        }}
      >
        {feed.items.map((item) => (
          <FeedVideoCard
            key={item.id}
            item={item}
            contentState={contentMap[item.id] ?? {}}
            onLoadContent={() => loadContent(item.id)}
            onLike={toggleLikeHandler}
            showOriginal={showOriginal}
            showTranslation={showTranslation}
          />
        ))}
      </div>

      {feed.hasMore && (
        <div style={{ marginTop: 12 }}>
          <Button
            variant="ghost"
            loading={feed.status === 'refreshing'}
            onClick={() => dispatch(loadFeed({ reset: false }))}
            style={{ width: '100%' }}
          >
            Загрузить ещё
          </Button>
        </div>
      )}
    </div>
  );
}
