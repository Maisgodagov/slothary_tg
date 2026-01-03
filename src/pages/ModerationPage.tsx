import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '../app/hooks';
import { selectAuth } from '../features/auth/slice';
import { adminApi, type PrecomputedExercise } from '../features/admin/api';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';

type Filter = 'all' | 'moderated' | 'pending';

type EditableExercise = {
  id: number;
  prompt: string;
  correctAnswer: string;
  options: string[];
  translations: string[];
  partOfSpeech: string | null;
  direction: 'en-ru' | 'ru-en';
  word: string;
  moderated: number;
};

const PAGE_SIZE = 20;

export default function ModerationPage() {
  const auth = useAppSelector(selectAuth);
  const navigate = useNavigate();
  const isAdmin = auth.profile?.role === 'admin';

  const [items, setItems] = useState<PrecomputedExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<Filter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState<EditableExercise | null>(null);
  const [saving, setSaving] = useState(false);

  const moderatedParam = useMemo(() => {
    if (filter === 'moderated') return 'true';
    if (filter === 'pending') return 'false';
    return undefined;
  }, [filter]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getPrecomputed({
          page,
          limit: PAGE_SIZE,
          moderated: moderatedParam as 'true' | 'false' | undefined,
          search: search || undefined,
        });
        setItems(res.items);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        console.error('Failed to load exercises', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, page, moderatedParam, search]);

  const openEdit = (item: PrecomputedExercise) => {
    let options: string[] = [];
    try {
      const parsed = JSON.parse(item.options);
      if (Array.isArray(parsed)) options = parsed.map((o) => String(o));
    } catch {
      options = [];
    }
    const translations = item.translations.split('||').map((t) => t.trim()).filter(Boolean);
    setEditing({
      id: item.id,
      prompt: item.prompt,
      correctAnswer: item.correct_answer,
      options,
      translations,
      partOfSpeech: item.part_of_speech,
      direction: item.direction,
      word: item.word,
      moderated: item.moderated,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    const { prompt, correctAnswer, options, translations, partOfSpeech } = editing;
    if (!prompt.trim() || !correctAnswer.trim() || options.length < 1 || translations.length < 1) {
      alert('Заполните промпт, правильный ответ, варианты и переводы');
      return;
    }
    const payload = {
      prompt: prompt.trim(),
      correctAnswer: correctAnswer.trim(),
      options: options.map((o) => o.trim()).filter(Boolean),
      translations: translations.map((t) => t.trim()).filter(Boolean),
      partOfSpeech: partOfSpeech?.trim() || null,
    };
    try {
      setSaving(true);
      await adminApi.updatePrecomputed(editing.id, payload);
      setItems((prev) =>
        prev.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                prompt: payload.prompt,
                correct_answer: payload.correctAnswer,
                options: JSON.stringify(payload.options),
                translations: payload.translations.join('||'),
                part_of_speech: payload.partOfSpeech,
              }
            : item,
        ),
      );
      setEditing(null);
    } catch (err) {
      console.error('Failed to save exercise', err);
      alert('Не удалось сохранить упражнение');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить упражнение?')) return;
    try {
      await adminApi.deletePrecomputed(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Не удалось удалить');
    }
  };

  const handleModerate = async (id: number, moderated: boolean) => {
    try {
      await adminApi.moderatePrecomputed(id, moderated);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, moderated: moderated ? 1 : 0 } : item)),
      );
    } catch (err) {
      console.error('Failed to moderate', err);
      alert('Не удалось обновить статус модерации');
    }
  };

  if (!isAdmin) {
    return (
      <div className="section">
        <div className="section-header">
          <h2 style={{ margin: 0 }}>Модерация упражнений</h2>
        </div>
        <p style={{ color: 'var(--tg-subtle)' }}>Доступно только администраторам.</p>
        <Button variant="ghost" onClick={() => navigate('/')}>
          На главную
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px',
        minHeight: '100vh',
        color: 'var(--tg-text)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0, flex: 1 }}>Модерация упражнений</h2>
        <Button variant="ghost" onClick={() => navigate('/')}>
          На главную
        </Button>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 12,
          padding: 12,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--tg-border)',
          marginBottom: 16,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <div style={{ flex: '1 1 240px' }}>
            <Input
              placeholder="Поиск по слову/промпту"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary">
            Искать
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
          >
            Сбросить
          </Button>
        </form>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Все', value: 'all' as Filter },
            { label: 'Промодерированные', value: 'moderated' as Filter },
            { label: 'Не промодерированные', value: 'pending' as Filter },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setFilter(opt.value);
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 12,
                border: '1px solid var(--tg-border)',
                background: filter === opt.value ? 'var(--tg-accent)' : 'rgba(255,255,255,0.04)',
                color: filter === opt.value ? '#0c1021' : 'var(--tg-text)',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--tg-subtle)' }}>
            Страница {page} из {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Назад
            </Button>
            <Button
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Вперед
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--tg-subtle)' }}>Загрузка...</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item) => {
            let options: string[] = [];
            try {
              const parsed = JSON.parse(item.options);
              if (Array.isArray(parsed)) options = parsed.map((o) => String(o));
            } catch {
              options = [];
            }
            const translations = item.translations.split('||').filter(Boolean);
            return (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--tg-border)',
                  borderRadius: 14,
                  padding: 14,
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: 'var(--tg-subtle)', fontSize: 12 }}>#{item.id}</span>
                  <strong style={{ fontSize: 16 }}>{item.word}</strong>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.08)',
                      fontSize: 12,
                    }}
                  >
                    {item.direction.toUpperCase()}
                  </span>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: item.moderated ? 'rgba(62, 201, 133, 0.18)' : 'rgba(255, 184, 0, 0.2)',
                      color: item.moderated ? '#3ec985' : '#ffb800',
                      fontSize: 12,
                      marginLeft: 'auto',
                    }}
                  >
                    {item.moderated ? 'Промодерировано' : 'Нужно проверить'}
                  </span>
                </div>

                <div style={{ color: 'var(--tg-subtle)', fontSize: 13, marginBottom: 6 }}>
                  Часть речи: {item.part_of_speech || '—'}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 13, color: 'var(--tg-subtle)' }}>Промпт</div>
                  <div style={{ fontWeight: 600 }}>{item.prompt}</div>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 13, color: 'var(--tg-subtle)' }}>Правильный ответ</div>
                  <div style={{ fontWeight: 600 }}>{item.correct_answer}</div>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 13, color: 'var(--tg-subtle)' }}>Варианты</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {options.map((opt, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.06)',
                          fontSize: 13,
                        }}
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: 'var(--tg-subtle)' }}>Переводы</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {translations.map((tr, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.06)',
                          fontSize: 13,
                        }}
                      >
                        {tr}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button variant="ghost" onClick={() => openEdit(item)}>
                    Редактировать
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(item.id)}>
                    Удалить
                  </Button>
                  <Button
                    variant={item.moderated ? 'ghost' : 'primary'}
                    onClick={() => handleModerate(item.id, !item.moderated)}
                  >
                    {item.moderated ? 'Снять модерацию' : 'Одобрить'}
                  </Button>
                </div>
              </div>
            );
          })}

          {!items.length && (
            <div style={{ color: 'var(--tg-subtle)', padding: 12 }}>Нет упражнений.</div>
          )}
        </div>
      )}

      {editing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: '#0f1428',
              color: 'var(--tg-text)',
              border: '1px solid var(--tg-border)',
              borderRadius: 16,
              maxWidth: 620,
              width: '100%',
              padding: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Редактировать упражнение #{editing.id}</h3>
              <button
                onClick={() => setEditing(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--tg-subtle)',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <Input
                label="Промпт"
                value={editing.prompt}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, prompt: e.target.value } : prev))}
              />
              <Input
                label="Правильный ответ"
                value={editing.correctAnswer}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, correctAnswer: e.target.value } : prev))
                }
              />

              <label style={{ display: 'block' }}>
                <div style={{ marginBottom: 6, color: 'var(--tg-subtle)', fontSize: 13, fontWeight: 600 }}>
                  Варианты (по одному в строке)
                </div>
                <textarea
                  style={textareaStyle}
                  rows={4}
                  value={editing.options.join('\n')}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, options: e.target.value.split('\n').map((v) => v.trim()) } : prev,
                    )
                  }
                />
              </label>

              <label style={{ display: 'block' }}>
                <div style={{ marginBottom: 6, color: 'var(--tg-subtle)', fontSize: 13, fontWeight: 600 }}>
                  Переводы (по одному в строке)
                </div>
                <textarea
                  style={textareaStyle}
                  rows={4}
                  value={editing.translations.join('\n')}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, translations: e.target.value.split('\n').map((v) => v.trim()) } : prev,
                    )
                  }
                />
              </label>

              <Input
                label="Часть речи (опционально)"
                value={editing.partOfSpeech ?? ''}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, partOfSpeech: e.target.value || null } : prev))
                }
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Отмена
              </Button>
              <Button onClick={handleSave} loading={saving}>
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const textareaStyle: CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: `1px solid var(--tg-border)`,
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--tg-text)',
  padding: '12px 14px',
  fontSize: 14,
  outline: 'none',
  resize: 'vertical',
};
