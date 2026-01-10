import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { muellerApi, type MuellerEntry } from '../features/mueller/api';
import { Icon } from '../shared/ui/Icon';
import { Loader } from '../shared/ui/Loader';

type LookupLang = 'en' | 'ru';

export default function WordDictionaryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<LookupLang>('en');
  const [items, setItems] = useState<MuellerEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const helperText = useMemo(() => {
    if (status === 'loading') return 'Ищем в словаре...';
    if (status === 'error') return error ?? 'Не удалось выполнить поиск';
    if (status === 'ready' && items.length === 0) return 'Ничего не найдено.';
    return null;
  }, [error, items.length, status]);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setStatus('loading');
    setError(null);
    setItems([]);
    setExpandedId(null);
    try {
      const results = await muellerApi.lookup({ word: trimmed, lang });
      setItems(results);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить поиск');
      setStatus('error');
    }
  }, [lang, query]);

  const placeholder =
    lang === 'ru' ? 'Введите слово по-русски' : 'Введите слово по-английски';

  return (
    <div
      className="page page--content"
      style={{
        display: 'grid',
        gap: 16,
        alignContent: 'start',
      }}
    >
      <div
        className="page-header"
        style={{
          background: 'var(--tg-surface)',
          border: '1px solid var(--tg-border)',
          borderRadius: 18,
          padding: 16,
          display: 'grid',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>Словарь</div>
          <button
            type="button"
            onClick={() => navigate('/video-dictionary')}
            style={{
              border: '1px solid var(--tg-border)',
              background: 'var(--tg-card)',
              color: 'var(--tg-text)',
              padding: '6px 10px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Видеословарь
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {(['en', 'ru'] as LookupLang[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setLang(mode)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid var(--tg-border)',
                background:
                  lang === mode ? 'rgba(109, 211, 255, 0.15)' : 'var(--tg-card)',
                color: 'var(--tg-text)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {mode === 'en' ? 'English' : 'Русский'}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              borderRadius: 12,
              border: '1px solid var(--tg-border)',
              padding: '10px 12px',
              background: 'var(--tg-card)',
              color: 'var(--tg-text)',
              fontSize: 14,
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch();
            }}
          />
          <button
            onClick={handleSearch}
            disabled={status === 'loading'}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: 'none',
              background: 'var(--tg-accent-strong)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              opacity: status === 'loading' ? 0.7 : 1,
            }}
            aria-label="Найти"
          >
            <Icon name="search" size={20} color="#fff" />
          </button>
        </div>
      </div>

      {helperText && (
        <div style={{ textAlign: 'center', color: 'var(--tg-subtle)', fontSize: 14 }}>
          {helperText}
        </div>
      )}

      {status === 'loading' && (
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <Loader />
        </div>
      )}

      {items.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((entry) => {
            const isOpen = expandedId === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
                style={{
                  border: '1px solid var(--tg-border)',
                  background: 'var(--tg-card)',
                  color: 'var(--tg-text)',
                  borderRadius: 14,
                  padding: 14,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700 }}>{entry.word}</div>
                {entry.partOfSpeech && (
                  <div style={{ fontSize: 12, color: 'var(--tg-subtle)' }}>
                    {entry.partOfSpeech}
                  </div>
                )}
                {isOpen && (
                  <div
                    style={{
                      display: 'grid',
                      gap: 6,
                      marginTop: 6,
                      color: 'var(--tg-text)',
                      fontSize: 14,
                    }}
                  >
                    {entry.translations.map((item, index) => (
                      <div
                        key={`${entry.id}-tr-${index}`}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 10,
                          background: 'var(--tg-surface)',
                          border: '1px solid var(--tg-border)',
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
