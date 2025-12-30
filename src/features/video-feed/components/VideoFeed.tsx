import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { Button } from '../../../shared/ui/Button';
import { Loader } from '../../../shared/ui/Loader';
import { selectAuth } from '../../auth/slice';
import { loadFeed, selectVideoFeed, toggleLike } from '../slice';
import { VideoCard } from './VideoCard';

export function VideoFeed() {
  const dispatch = useAppDispatch();
  const feed = useAppSelector(selectVideoFeed);
  const auth = useAppSelector(selectAuth);

  useEffect(() => {
    if (feed.items.length === 0) {
      dispatch(loadFeed({ reset: true }));
    }
  }, []);

  return (
    <div className="section">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Видео-лента</span>
          <span className="badge">{auth.profile ? 'Вход выполнен' : 'Гость'}</span>
        </div>
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

      <div style={{ display: 'grid', gap: 14 }}>
        {feed.items.map((item) => (
          <VideoCard key={item.id} item={item} onLike={(id) => dispatch(toggleLike(id))} />
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
