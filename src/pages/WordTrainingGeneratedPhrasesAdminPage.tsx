import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';

import { useAppSelector } from '../app/hooks';
import { selectAuth } from '../features/auth/slice';
import {
  type GeneratedPhraseItem,
  wordTrainingSnippetsAdminApi,
} from '../features/admin/wordTrainingSnippetsApi';
import { Button } from '../shared/ui/Button';
import { PageShell } from '../shared/ui/PageShell';

const PAGE_SIZE = 50;

export default function WordTrainingGeneratedPhrasesAdminPage() {
  const auth = useAppSelector(selectAuth);
  const role = auth.profile?.role ?? null;
  const isAdmin = role === 'admin';

  const [items, setItems] = useState<GeneratedPhraseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAudioId, setActiveAudioId] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = async (nextOffset = 0, replace = true) => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const result = await wordTrainingSnippetsAdminApi.listGeneratedPhrases(
        {
          limit: PAGE_SIZE,
          offset: nextOffset,
          search: search.trim() || undefined,
        },
        role,
      );
      setTotal(result.total);
      setOffset(result.offset);
      setItems((prev) => (replace ? result.items : [...prev, ...result.items]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить фразы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, role]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load(0, true);
    }, 260);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(
    () => () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current = null;
    },
    [],
  );

  const playAudio = async (item: GeneratedPhraseItem) => {
    const url = item.phraseAudioUrl?.trim();
    if (!url) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setActiveAudioId(item.id);
    audio.onended = () => {
      if (activeAudioId === item.id) {
        setActiveAudioId(null);
      }
    };
    try {
      await audio.play();
    } catch {
      setActiveAudioId(null);
    }
  };

  const canLoadMore = items.length < total;

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={{ padding: 16, color: 'var(--tg-subtle)' }}>
          {'Доступно только для администратора.'}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={{ padding: 12, paddingBottom: 70, display: 'grid', gap: 12 }}>
        <div className="page-header" style={{ fontSize: 18, fontWeight: 700 }}>
          {'Фразы для тренировки слов'}
        </div>

        <div className="section" style={{ display: 'grid', gap: 8 }}>
          <div style={{ color: 'var(--tg-subtle)', fontSize: 14 }}>
            {'Всего фраз: '}{total}
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по слову/фразе"
            style={inputStyle}
          />
        </div>

        {loading && items.length === 0 && (
          <div className="section" style={{ color: 'var(--tg-subtle)' }}>
            {'Загрузка...'}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="section" style={{ color: 'var(--tg-subtle)' }}>
            {'Фразы не найдены.'}
          </div>
        )}

        {items.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {items.map((item) => (
              <div key={item.id} className="section" style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--tg-subtle)' }}>
                    {'Слово: '}{item.word}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--tg-subtle)' }}>
                    {item.phraseAudioVoice || '—'}
                  </div>
                </div>

                <div style={{ fontSize: 16, fontWeight: 700 }}>{item.phraseEn}</div>
                <div style={{ fontSize: 14, color: 'var(--tg-subtle)' }}>{item.phraseRu || '—'}</div>

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    onClick={() => void playAudio(item)}
                    disabled={!item.phraseAudioUrl}
                    aria-label="Проиграть аудио"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: '1px solid var(--tg-border)',
                      background: 'var(--tg-card)',
                      color: 'var(--tg-text)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: item.phraseAudioUrl ? 1 : 0.45,
                      outline:
                        activeAudioId === item.id ? '1px solid rgba(76,196,255,0.7)' : 'none',
                    }}
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {canLoadMore && (
          <Button
            variant="ghost"
            disabled={loading}
            onClick={() => void load(offset + PAGE_SIZE, false)}
          >
            {'Показать еще'}
          </Button>
        )}

        {error && <div style={{ color: 'var(--tg-danger)' }}>{error}</div>}
      </div>
    </PageShell>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid var(--tg-border)',
  background: 'var(--tg-surface)',
  color: 'var(--tg-text)',
  padding: '10px 12px',
  fontSize: 14,
};

