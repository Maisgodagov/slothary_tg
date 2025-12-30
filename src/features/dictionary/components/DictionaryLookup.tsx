import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { selectAuth } from '../../auth/slice';
import { addWord, fetchDictionary, selectDictionary } from '../slice';

export function DictionaryLookup() {
  const dispatch = useAppDispatch();
  const dictionary = useAppSelector(selectDictionary);
  const auth = useAppSelector(selectAuth);
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');

  useEffect(() => {
    if (auth.profile?.id && dictionary.items.length === 0) {
      dispatch(fetchDictionary());
    }
  }, [auth.profile?.id]);

  if (!auth.profile) {
    return (
      <div className="section">
        <div className="section-header">
          <h3 style={{ margin: 0 }}>Словарь</h3>
        </div>
        <div style={{ color: 'var(--tg-subtle)' }}>Войдите, чтобы просматривать сохранённые слова.</div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-header">
        <h3 style={{ margin: 0 }}>Словарь</h3>
        <Button variant="ghost" onClick={() => dispatch(fetchDictionary())}>
          Обновить
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!word || !translation) return;
          dispatch(addWord({ word, translation, sourceLang: 'en', targetLang: 'ru' }));
          setWord('');
          setTranslation('');
        }}
        style={{ display: 'grid', gap: 8, marginBottom: 10 }}
      >
        <Input label="Слово" value={word} onChange={(e) => setWord(e.target.value)} placeholder="to improve" required />
        <Input
          label="Перевод"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="улучшать"
          required
        />
        <Button type="submit" variant="primary">
          Добавить
        </Button>
      </form>

      {dictionary.status === 'loading' && <div style={{ color: 'var(--tg-subtle)' }}>Загрузка...</div>}
      {dictionary.error && <div style={{ color: 'var(--tg-danger)' }}>{dictionary.error}</div>}

      <div style={{ display: 'grid', gap: 8 }}>
        {dictionary.items.map((entry) => (
          <div
            key={entry.id}
            style={{
              padding: 10,
              borderRadius: 12,
              border: '1px solid var(--tg-border)',
              background: 'var(--tg-card)',
            }}
          >
            <div style={{ fontWeight: 700 }}>{entry.word}</div>
            <div style={{ color: 'var(--tg-subtle)' }}>{entry.translation}</div>
            {entry.transcription && <div style={{ color: 'var(--tg-subtle)', fontSize: 12 }}>{entry.transcription}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
