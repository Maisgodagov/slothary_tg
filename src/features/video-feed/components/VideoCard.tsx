import dayjs from 'dayjs';
import type { VideoFeedItem } from '../types';
import { Button } from '../../../shared/ui/Button';

interface VideoCardProps {
  item: VideoFeedItem;
  onLike?: (id: string) => void;
}

export function VideoCard({ item, onLike }: VideoCardProps) {
  const duration = item.durationSeconds ? Math.round(item.durationSeconds) : null;
  const published = item.createdAt ? dayjs(item.createdAt).format('DD MMM') : '';

  return (
    <div
      style={{
        display: 'grid',
        gap: 10,
        background: 'var(--tg-card)',
        border: '1px solid var(--tg-border)',
        borderRadius: 16,
        padding: 12,
      }}
    >
      <video
        src={item.videoUrl}
        controls
        preload="metadata"
        style={{
          width: '100%',
          borderRadius: 14,
          background: '#000',
          aspectRatio: '9 / 16',
          objectFit: 'cover',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{item.videoName}</div>
          <div style={{ color: 'var(--tg-subtle)', fontSize: 13 }}>
            {item.analysis.cefrLevel} • {item.analysis.speechSpeed}
            {duration ? ` • ${duration}s` : ''} {published ? `• ${published}` : ''}
          </div>
        </div>
        <Button
          variant={item.isLiked ? 'primary' : 'ghost'}
          style={{ minWidth: 94 }}
          onClick={() => onLike?.(item.id)}
        >
          ❤️ {item.likesCount}
        </Button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {item.analysis.topics.map((topic) => (
          <span key={topic} className="badge">
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
}
