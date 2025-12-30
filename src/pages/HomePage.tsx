import { useAppSelector } from '../app/hooks';
import { selectAuth } from '../features/auth/slice';
import { VideoFeed } from '../features/video-feed/components/VideoFeed';
import { DictionaryLookup } from '../features/dictionary/components/DictionaryLookup';
import { Button } from '../shared/ui/Button';

function Hero() {
  const auth = useAppSelector(selectAuth);

  return (
    <div
      className="section"
      style={{
        background: 'linear-gradient(135deg, rgba(46,163,255,0.16), rgba(109,211,255,0.08))',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Учите английский на коротких видео</div>
          <div style={{ color: 'var(--tg-subtle)', marginTop: 6 }}>
            Вертикальная лента как в TikTok: смотрите, переводите субтитры, проходите упражнения.
          </div>
        </div>
        <div className="badge">{auth.profile ? 'Аккаунт' : 'Гость'}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const auth = useAppSelector(selectAuth);

  return (
    <>
      <Hero />
      {!auth.profile && (
        <div className="section" style={{ borderStyle: 'dashed' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Чтобы синхронизировать прогресс, войдите</div>
          <div style={{ color: 'var(--tg-subtle)', marginBottom: 12 }}>
            Можно начать как гость, но сохранение слов и прогресс доступны после авторизации.
          </div>
          <Button onClick={() => window.location.hash = '#/profile'} variant="ghost">
            Перейти к входу
          </Button>
        </div>
      )}
      <VideoFeed />
      <DictionaryLookup />
    </>
  );
}
