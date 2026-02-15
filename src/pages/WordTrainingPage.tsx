import { useEffect, useMemo, useState } from 'react';

import { useAppSelector } from '../app/hooks';
import { selectAuth } from '../features/auth/slice';
import {
  type RecognitionTask,
  type ReinforcementTask,
  type WordTrainingContext,
  type WordTrainingOverview,
  type WordTrainingState,
  wordTrainingApi,
} from '../features/word-training/api';
import { PageShell } from '../shared/ui/PageShell';
import { Button } from '../shared/ui/Button';

const normalize = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]+/gi, '')
    .replace(/\s+/g, ' ');

export default function WordTrainingPage() {
  const auth = useAppSelector(selectAuth);
  const userId = auth.profile?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<WordTrainingOverview | null>(null);
  const [state, setState] = useState<WordTrainingState | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [examples, setExamples] = useState<WordTrainingContext[]>([]);
  const [answerInput, setAnswerInput] = useState('');
  const [assembleAnswer, setAssembleAnswer] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const session = state?.session ?? null;
  const task = state?.task ?? null;
  const energyPercent = session ? Math.max(0, Math.round((session.energyLeft / session.energyStart) * 100)) : 0;

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await wordTrainingApi.getOverview(userId);
      setOverview(data);
      if (data.activeSession?.id) {
        const sessionState = await wordTrainingApi.getSession(data.activeSession.id, userId);
        setState(sessionState);
      } else {
        setState(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    setShowTranslation(false);
    setExamples([]);
    setAnswerInput('');
    setAssembleAnswer([]);
  }, [task?.mode, task && 'itemId' in task ? task.itemId : null]);

  const startOrResume = async () => {
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await wordTrainingApi.startSession(
        { targetWords: overview?.suggestedTargetWords ?? 20 },
        userId,
      );
      setState(result);
      const freshOverview = await wordTrainingApi.getOverview(userId);
      setOverview(freshOverview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось начать тренировку');
    } finally {
      setSubmitting(false);
    }
  };

  const finishEarly = async () => {
    if (!userId || !session) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await wordTrainingApi.finishSession(session.id, { force: true }, userId);
      setState(result);
      const freshOverview = await wordTrainingApi.getOverview(userId);
      setOverview(freshOverview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось завершить тренировку');
    } finally {
      setSubmitting(false);
    }
  };

  const submitGrade = async (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!userId || !session || !task || task.mode !== 'recognition') return;
    setSubmitting(true);
    setError(null);
    try {
      const next = await wordTrainingApi.submitRecognition(
        session.id,
        { itemId: task.itemId, grade },
        userId,
      );
      setState(next);
      if (next.alternateExample) {
        setExamples([next.alternateExample]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить ответ');
    } finally {
      setSubmitting(false);
    }
  };

  const loadMoreExamples = async () => {
    if (!userId || !task) return;
    setSubmitting(true);
    try {
      const result = await wordTrainingApi.getExamples(task.word, userId, 3);
      setExamples(result.items);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmitReinforcement = useMemo(() => {
    if (!task || task.mode !== 'reinforcement') return false;
    if (task.reinforcement.type === 'fill-gap') {
      return normalize(answerInput).length > 0;
    }
    return assembleAnswer.length > 0;
  }, [answerInput, assembleAnswer, task]);

  const submitReinforcement = async () => {
    if (!userId || !session || !task || task.mode !== 'reinforcement') return;
    const target = normalize(task.reinforcement.targetWord);
    const isCorrect =
      task.reinforcement.type === 'fill-gap'
        ? normalize(answerInput) === target
        : normalize(assembleAnswer.join(' ')) === normalize(task.reinforcement.sentence);

    setSubmitting(true);
    setError(null);
    try {
      const next = await wordTrainingApi.submitReinforcement(
        session.id,
        {
          itemId: task.itemId,
          exerciseType: task.reinforcement.type,
          isCorrect,
        },
        userId,
      );
      setState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить упражнение');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRecognition = (recognition: RecognitionTask) => (
    <div className="section" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Шаг 1. Узнавание</strong>
        <span className="badge">{recognition.queuePosition}/{recognition.queueTotal}</span>
      </div>
      {recognition.context?.text && (
        <div style={{ fontSize: 14, color: 'var(--tg-subtle)', lineHeight: 1.4 }}>
          {recognition.context.text}
        </div>
      )}
      <div style={{ fontSize: 34, fontWeight: 800 }}>{recognition.word}</div>
      {!showTranslation ? (
        <Button onClick={() => setShowTranslation(true)} style={{ width: '100%' }}>
          Показать перевод
        </Button>
      ) : (
        <>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{recognition.translation}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            <Button variant="danger" onClick={() => submitGrade('again')} disabled={submitting}>Забыл</Button>
            <Button variant="ghost" onClick={() => submitGrade('hard')} disabled={submitting}>Трудно</Button>
            <Button variant="primary" onClick={() => submitGrade('good')} disabled={submitting}>Хорошо</Button>
            <Button variant="primary" onClick={() => submitGrade('easy')} disabled={submitting}>Легко</Button>
          </div>
        </>
      )}
      <Button variant="ghost" onClick={loadMoreExamples} disabled={submitting}>
        Показать еще 3 примера
      </Button>
      {examples.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          {examples.map((example) => (
            <div key={`${example.contentId}-${example.startSeconds ?? 0}`} style={{ border: '1px solid var(--tg-border)', borderRadius: 12, padding: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{example.videoName || `Видео #${example.contentId}`}</div>
              <div style={{ fontSize: 13, color: 'var(--tg-subtle)' }}>{example.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReinforcement = (reinforcement: ReinforcementTask) => (
    <div className="section" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Шаг 2. Закрепление</strong>
        <span className="badge">{reinforcement.queuePosition}/{reinforcement.queueTotal}</span>
      </div>
      <div style={{ fontSize: 14, color: 'var(--tg-subtle)' }}>
        {reinforcement.reinforcement.type === 'fill-gap'
          ? 'Впиши слово в пропуск'
          : 'Собери фразу в правильном порядке'}
      </div>
      {reinforcement.reinforcement.type === 'fill-gap' ? (
        <>
          <div style={{ fontSize: 16, lineHeight: 1.45 }}>
            {reinforcement.reinforcement.sentence.replace(
              new RegExp(reinforcement.word, 'i'),
              '_____',
            )}
          </div>
          <input
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            placeholder="Введите слово"
            style={{
              width: '100%',
              borderRadius: 12,
              border: '1px solid var(--tg-border)',
              background: 'var(--tg-surface)',
              color: 'var(--tg-text)',
              padding: '10px 12px',
              fontSize: 15,
            }}
          />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {reinforcement.reinforcement.assembleTokens.map((token, index) => (
              <button
                key={`${token}-${index}`}
                type="button"
                onClick={() => setAssembleAnswer((prev) => [...prev, token])}
                style={{
                  border: '1px solid var(--tg-border)',
                  borderRadius: 12,
                  background: 'var(--tg-card)',
                  color: 'var(--tg-text)',
                  padding: '6px 10px',
                }}
              >
                {token}
              </button>
            ))}
          </div>
          <div style={{ minHeight: 44, border: '1px dashed var(--tg-border)', borderRadius: 12, padding: 10, fontSize: 15 }}>
            {assembleAnswer.join(' ')}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={() => setAssembleAnswer([])} style={{ flex: 1 }}>Сбросить</Button>
          </div>
        </>
      )}
      <Button onClick={submitReinforcement} disabled={!canSubmitReinforcement || submitting}>
        Проверить
      </Button>
    </div>
  );

  if (!userId) {
    return (
      <PageShell>
        <div style={{ padding: 16 }}>Нужна авторизация.</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={{ padding: 14, display: 'grid', gap: 12 }}>
        <div className="section" style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Умная тренировка слов</div>
          <div style={{ color: 'var(--tg-subtle)', fontSize: 14 }}>
            Сначала повторение, затем ошибки, потом новые слова.
          </div>
          {session && (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ height: 10, background: 'var(--tg-border)', borderRadius: 999, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${energyPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #ffc857, #6dd3ff)',
                    transition: 'width 220ms ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 13, color: 'var(--tg-subtle)' }}>
                Энергия: {session.energyLeft}/{session.energyStart} • Выполнено слов: {session.wordsCompleted}/{session.targetWords}
              </div>
            </div>
          )}
        </div>

        {error && <div className="section" style={{ color: 'var(--tg-danger)' }}>{error}</div>}
        {loading && <div className="section">Загрузка...</div>}

        {!loading && !session && overview && (
          <>
            <div className="section" style={{ display: 'grid', gap: 6 }}>
              <div>Сегодня:</div>
              <div style={{ color: 'var(--tg-subtle)' }}>Повторение: {overview.dueCount}</div>
              <div style={{ color: 'var(--tg-subtle)' }}>Слова с ошибками: {overview.mistakeCount}</div>
              <div style={{ color: 'var(--tg-subtle)' }}>Новые слова: {overview.newCount}</div>
              <div style={{ color: 'var(--tg-subtle)' }}>Рекомендованный размер: {overview.suggestedTargetWords}</div>
            </div>
            <Button onClick={startOrResume} disabled={submitting}>
              Начать тренировку
            </Button>
          </>
        )}

        {!loading && session && task && task.mode === 'recognition' && renderRecognition(task)}
        {!loading && session && task && task.mode === 'reinforcement' && renderReinforcement(task)}

        {!loading && session && !task && (
          <div className="section" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Сессия завершена</div>
            <div style={{ color: 'var(--tg-subtle)' }}>
              +{session.xpEarned} XP • Закрыто слов: {session.wordsCompleted}
            </div>
            {state?.summary && (
              <div style={{ color: 'var(--tg-subtle)' }}>
                За сегодня: {state.summary.totalWordsToday} слов и {state.summary.totalXpToday} XP
              </div>
            )}
            <Button onClick={load} disabled={submitting}>Обновить</Button>
          </div>
        )}

        {session?.status === 'active' && (
          <Button variant="ghost" onClick={finishEarly} disabled={submitting}>
            Завершить сессию
          </Button>
        )}
      </div>
    </PageShell>
  );
}
