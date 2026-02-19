import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Volume2, X } from 'lucide-react';

import { useAppSelector } from '../app/hooks';
import { selectAuth } from '../features/auth/slice';
import {
  type RecognitionTask,
  type ReinforcementTask,
  type WordTrainingOverview,
  type WordTrainingState,
  wordTrainingApi,
} from '../features/word-training/api';
import { Button } from '../shared/ui/Button';
import { PageShell } from '../shared/ui/PageShell';

const normalize = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]+/gu, '')
    .replace(/\s+/g, ' ');

const normalizeLoose = (value: string): string => normalize(value.replace(/[.,!?;:]/g, ' '));

export default function WordTrainingPage() {
  const auth = useAppSelector(selectAuth);
  const userId = auth.profile?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<WordTrainingOverview | null>(null);
  const [state, setState] = useState<WordTrainingState | null>(null);

  const [assembleAnswer, setAssembleAnswer] = useState<string[]>([]);
  const [recognitionSelected, setRecognitionSelected] = useState<string | null>(null);
  const [recognitionChecked, setRecognitionChecked] = useState(false);
  const [recognitionWrongOption, setRecognitionWrongOption] = useState<string | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<'correct' | 'wrong' | null>(null);
  const [missingSelected, setMissingSelected] = useState<string | null>(null);
  const [pairMatches, setPairMatches] = useState<Record<string, string>>({});
  const [pairLeftSelected, setPairLeftSelected] = useState<string | null>(null);
  const [pairRightSelected, setPairRightSelected] = useState<string | null>(null);
  const [pairWrongWord, setPairWrongWord] = useState<string | null>(null);
  const [pairWrongTranslation, setPairWrongTranslation] = useState<string | null>(null);
  const [reinforcementChecked, setReinforcementChecked] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const session = state?.session ?? null;
  const task = state?.task ?? null;
  const taskId = task?.itemId ?? null;
  const lessonProgressPercent = useMemo(() => {
    if (!session) return 0;
    if (task && task.queueTotal > 0) {
      return Math.max(0, Math.min(100, Math.round((task.queuePosition / task.queueTotal) * 100)));
    }
    if (session.targetWords > 0) {
      return Math.max(0, Math.min(100, Math.round((session.wordsCompleted / session.targetWords) * 100)));
    }
    return 0;
  }, [session, task]);

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return;
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } catch {
      // ignore
    }
    audioRef.current = null;
  }, []);

  const playAudioUrl = useCallback(async (audioUrl?: string | null) => {
    const trimmed = audioUrl?.trim();
    if (!trimmed) return;

    stopAudio();

    const audio = new Audio(trimmed);
    audio.preload = 'auto';
    audioRef.current = audio;

    try {
      await audio.play();
    } catch {
      // autoplay can be blocked
    }
  }, [stopAudio]);

  const playPronunciation = useCallback(
    async (taskLike: RecognitionTask | ReinforcementTask | null) => {
      await playAudioUrl(taskLike?.pronunciationAudioUrl ?? null);
    },
    [playAudioUrl],
  );

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
    setAssembleAnswer([]);
    setRecognitionSelected(null);
    setRecognitionChecked(false);
    setRecognitionWrongOption(null);
    setRecognitionResult(null);
    setMissingSelected(null);
    setPairMatches({});
    setPairLeftSelected(null);
    setPairRightSelected(null);
    setPairWrongWord(null);
    setPairWrongTranslation(null);
    setReinforcementChecked(false);
    stopAudio();
    const shouldAutoplay =
      task &&
      !(
        task.mode === 'reinforcement' &&
        task.reinforcement.type === 'match_pairs'
      );
    if (shouldAutoplay) {
      void playPronunciation(task);
    }
  }, [taskId, playPronunciation, stopAudio, task]);

  useEffect(() => () => stopAudio(), [stopAudio]);

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

  const submitRecognitionResult = async (recognition: RecognitionTask) => {
    if (!userId || !session) return;
    if (!recognitionSelected) return;

    const isCorrect = normalize(recognitionSelected) === normalize(recognition.translation);
    const grade = isCorrect ? 'good' : 'again';

    setSubmitting(true);
    setError(null);

    try {
      const next = await wordTrainingApi.submitRecognition(
        session.id,
        { itemId: recognition.itemId, grade },
        userId,
      );
      setState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить ответ');
    } finally {
      setSubmitting(false);
    }
  };

  const getTokenUsage = useCallback(
    (tokens: string[]) => {
      const counts = new Map<string, number>();
      for (const token of tokens) {
        const key = normalizeLoose(token);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return counts;
    },
    [],
  );

  const isReinforcementCorrect = useMemo(() => {
    if (!task || task.mode !== 'reinforcement') return false;
    const type = task.reinforcement.type;

    if (type === 'missing') {
      return normalize(missingSelected ?? '') === normalize(task.reinforcement.correctWord ?? '');
    }

    if (type === 'audio_assemble') {
      const target = task.reinforcement.targetTokens ?? [];
      if (!target.length || assembleAnswer.length !== target.length) return false;
      for (let i = 0; i < target.length; i += 1) {
        if (normalizeLoose(assembleAnswer[i] ?? '') !== normalizeLoose(target[i] ?? '')) return false;
      }
      return true;
    }

    const pairs = task.reinforcement.pairs ?? [];
    if (!pairs.length) return false;
    return pairs.every((pair) => normalize(pairMatches[pair.word] ?? '') === normalize(pair.translation));
  }, [assembleAnswer, missingSelected, pairMatches, task]);

  const canCheckReinforcement = useMemo(() => {
    if (!task || task.mode !== 'reinforcement') return false;
    const type = task.reinforcement.type;

    if (type === 'missing') return Boolean(missingSelected);
    if (type === 'audio_assemble') {
      const targetLength = (task.reinforcement.targetTokens ?? []).length;
      return targetLength > 0 && assembleAnswer.length === targetLength;
    }

    const pairs = task.reinforcement.pairs ?? [];
    if (!pairs.length) return false;
    return pairs.every((pair) => Boolean(pairMatches[pair.word]));
  }, [assembleAnswer, missingSelected, pairMatches, task]);

  const submitReinforcement = async () => {
    if (!userId || !session || !task || task.mode !== 'reinforcement') return;
    if (task.reinforcement.type === 'match_pairs') {
      if (!isReinforcementCorrect) return;
      setSubmitting(true);
      setError(null);

      try {
        const next = await wordTrainingApi.submitReinforcement(
          session.id,
          {
            itemId: task.itemId,
            exerciseType: task.reinforcement.type,
            isCorrect: true,
          },
          userId,
        );
        setState(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось сохранить упражнение');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!reinforcementChecked) {
      setReinforcementChecked(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const next = await wordTrainingApi.submitReinforcement(
        session.id,
        {
          itemId: task.itemId,
          exerciseType: task.reinforcement.type,
          isCorrect: isReinforcementCorrect,
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

  const renderRecognition = (recognition: RecognitionTask) => {
    const options: string[] =
      recognition.recognitionOptions?.length > 0
        ? recognition.recognitionOptions
        : [recognition.translation];

    return (
      <div className="section" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Выбери правильный перевод</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{recognition.word}</div>
          <button
            type="button"
            onClick={() => void playPronunciation(recognition)}
            disabled={!recognition.pronunciationAudioUrl}
            aria-label="Проиграть произношение"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              border: '1px solid var(--tg-border)',
              background: 'var(--tg-card)',
              color: 'var(--tg-text)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: recognition.pronunciationAudioUrl ? 1 : 0.45,
            }}
          >
            <Volume2 size={19} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {options.map((option, index) => {
            const isCorrectOption = normalize(option) === normalize(recognition.translation);
            const showCorrect = recognitionChecked && isCorrectOption;
            const showWrong = normalize(recognitionWrongOption ?? '') === normalize(option);
            return (
              <Button
                key={`${option}-${index}`}
                variant="ghost"
                onClick={() => {
                  if (recognitionChecked) return;
                  if (isCorrectOption) {
                    setRecognitionSelected(option);
                    setRecognitionChecked(true);
                    setRecognitionWrongOption(null);
                    setRecognitionResult('correct');
                    return;
                  }
                  setRecognitionSelected(null);
                  setRecognitionWrongOption(option);
                  setRecognitionResult('wrong');
                  window.setTimeout(() => {
                    setRecognitionWrongOption((prev) =>
                      normalize(prev ?? '') === normalize(option) ? null : prev,
                    );
                  }, 1000);
                }}
                disabled={submitting || recognitionChecked}
                className={showWrong ? 'slot-shake' : undefined}
                style={{
                  minHeight: 44,
                  borderColor: showCorrect
                    ? 'rgba(67, 201, 127, 0.9)'
                    : showWrong
                    ? 'rgba(255, 95, 109, 0.9)'
                    : undefined,
                  borderWidth: showCorrect || showWrong ? 3 : 1,
                }}
              >
                {option}
              </Button>
            );
          })}
        </div>

        {recognitionResult && (
          <div
            style={{
              borderRadius: 12,
              padding: 10,
              border: `1px solid ${
                recognitionResult === 'correct' ? 'rgba(67, 201, 127, 0.6)' : 'rgba(255, 95, 109, 0.6)'
              }`,
              background:
                recognitionResult === 'correct' ? 'rgba(67, 201, 127, 0.12)' : 'rgba(255, 95, 109, 0.12)',
              fontWeight: 700,
            }}
          >
            {recognitionResult === 'correct' ? 'Правильно' : 'Неправильно'}
          </div>
        )}

        {recognitionChecked && (
          <Button onClick={() => void submitRecognitionResult(recognition)} disabled={submitting}>
            Далее
          </Button>
        )}
      </div>
    );
  };

  const renderMissingExercise = (reinforcement: ReinforcementTask) => {
    const options = reinforcement.reinforcement.options ?? [];
    const sentenceWithBlank = reinforcement.reinforcement.sentenceWithBlank ?? reinforcement.reinforcement.sentence ?? '';
    const sentenceParts = sentenceWithBlank.split(/(_{3,})/g);

    return (
      <>
        <div
          style={{
            minHeight: 52,
            padding: 4,
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {sentenceParts.map((part, index) =>
            /^_{3,}$/.test(part) ? (
              <span
                key={`blank-${index}`}
                className={reinforcementChecked && !isReinforcementCorrect ? 'slot-shake' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 90,
                  minHeight: 34,
                  borderRadius: 10,
                  border: reinforcementChecked
                    ? isReinforcementCorrect
                      ? '3px solid rgba(67, 201, 127, 0.85)'
                      : '3px solid rgba(255, 95, 109, 0.9)'
                    : '3px dashed var(--tg-border)',
                  margin: '0 6px',
                  verticalAlign: 'middle',
                  color: 'var(--tg-text)',
                  fontSize: 16,
                  fontWeight: 700,
                  background: reinforcementChecked
                    ? isReinforcementCorrect
                      ? 'rgba(67, 201, 127, 0.12)'
                      : 'rgba(255, 95, 109, 0.12)'
                    : 'rgba(255,255,255,0.03)',
                }}
              >
                {missingSelected ?? ''}
              </span>
            ) : (
              <span key={`text-${index}`}>{part}</span>
            ),
          )}
        </div>

        {reinforcement.reinforcement.phraseAudioUrl && (
          <Button
            variant="ghost"
            onClick={() => void playAudioUrl(reinforcement.reinforcement.phraseAudioUrl ?? null)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
          >
            <Volume2 size={16} /> Проиграть фразу
          </Button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {options.map((option, index) => {
            return (
              <Button
                key={`${option}-${index}`}
                variant="ghost"
                onClick={() => {
                  if (reinforcementChecked) return;
                  setMissingSelected(option);
                }}
                disabled={submitting || reinforcementChecked}
                style={{ minHeight: 44 }}
              >
                {option}
              </Button>
            );
          })}
        </div>

        {reinforcementChecked && (
          <div
            style={{
              borderRadius: 12,
              padding: 10,
              border: `1px solid ${isReinforcementCorrect ? 'rgba(67, 201, 127, 0.6)' : 'rgba(255, 95, 109, 0.6)'}`,
              background: isReinforcementCorrect ? 'rgba(67, 201, 127, 0.12)' : 'rgba(255, 95, 109, 0.12)',
              display: 'grid',
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 700 }}>{isReinforcementCorrect ? 'Правильно' : 'Неправильно'}</div>
            {reinforcement.reinforcement.sentenceTranslation ? (
              <div style={{ color: 'var(--tg-subtle)' }}>Перевод: {reinforcement.reinforcement.sentenceTranslation}</div>
            ) : null}
          </div>
        )}
      </>
    );
  };

  const renderAudioAssembleExercise = (reinforcement: ReinforcementTask) => {
    const targetTokens = reinforcement.reinforcement.targetTokens ?? [];
    const assembleTokens = reinforcement.reinforcement.assembleTokens ?? [];
    const maxSlots = targetTokens.length;

    const answerUsage = getTokenUsage(assembleAnswer);
    const bankUsageLimit = getTokenUsage(assembleTokens);

    return (
      <>
        {reinforcement.reinforcement.sentenceTranslation ? (
          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25 }}>
            {reinforcement.reinforcement.sentenceTranslation}
          </div>
        ) : null}

        <div
          style={{
            minHeight: 52,
            padding: 2,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: maxSlots }).map((_, idx) => {
            const token = assembleAnswer[idx];
            const target = targetTokens[idx];
            const isSlotCorrect = reinforcementChecked && token && normalizeLoose(token) === normalizeLoose(target ?? '');
            const isSlotWrong = reinforcementChecked && token && !isSlotCorrect;
            return (
              <span
                key={`slot-${idx}`}
                className={isSlotWrong ? 'slot-shake' : undefined}
                onClick={() => {
                  if (reinforcementChecked || !token) return;
                  setAssembleAnswer((prev) => prev.filter((_, itemIndex) => itemIndex !== idx));
                }}
                style={{
                  minWidth: 58,
                  minHeight: 32,
                  borderRadius: 10,
                  padding: '4px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isSlotCorrect
                    ? '3px solid rgba(67, 201, 127, 0.7)'
                    : isSlotWrong
                    ? '3px solid rgba(255, 95, 109, 0.7)'
                    : '3px dashed var(--tg-border)',
                  background:
                    isSlotCorrect
                      ? 'rgba(67, 201, 127, 0.12)'
                      : isSlotWrong
                      ? 'rgba(255, 95, 109, 0.12)'
                      : 'rgba(255,255,255,0.03)',
                  color: token ? 'var(--tg-text)' : 'var(--tg-subtle)',
                  cursor: token && !reinforcementChecked ? 'pointer' : 'default',
                }}
              >
                {token || ''}
              </span>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {assembleTokens.map((token, index) => {
            const key = normalizeLoose(token);
            const used = answerUsage.get(key) ?? 0;
            const max = bankUsageLimit.get(key) ?? 0;
            const disabled = reinforcementChecked || used >= max || assembleAnswer.length >= maxSlots;

            return (
              <button
                key={`${token}-${index}`}
                type="button"
                onClick={() => {
                  if (disabled) return;
                  setAssembleAnswer((prev) => [...prev, token]);
                }}
                disabled={disabled}
                style={{
                  border: '1px solid var(--tg-border)',
                  borderRadius: 12,
                  background: disabled ? 'rgba(255,255,255,0.02)' : 'var(--tg-card)',
                  color: 'var(--tg-text)',
                  padding: '6px 10px',
                  opacity: disabled ? 0.55 : 1,
                }}
              >
                {token}
              </button>
            );
          })}
        </div>

        {reinforcementChecked && (
          <div
            style={{
              borderRadius: 12,
              padding: 10,
              border: `1px solid ${isReinforcementCorrect ? 'rgba(67, 201, 127, 0.6)' : 'rgba(255, 95, 109, 0.6)'}`,
              background: isReinforcementCorrect ? 'rgba(67, 201, 127, 0.12)' : 'rgba(255, 95, 109, 0.12)',
              fontWeight: 700,
            }}
          >
            {isReinforcementCorrect ? 'Правильно' : 'Неправильно'}
          </div>
        )}
      </>
    );
  };

  const renderMatchPairsExercise = (reinforcement: ReinforcementTask) => {
    const pairs = reinforcement.reinforcement.pairs ?? [];
    const shuffledTranslations = reinforcement.reinforcement.shuffledTranslations ?? [];
    const checkAndAssignPair = (word: string, translation: string) => {
      const target = pairs.find((pair) => pair.word === word);
      if (!target) return;

      if (normalize(target.translation) === normalize(translation)) {
        setPairMatches((prev) => ({ ...prev, [word]: translation }));
        setPairWrongWord(null);
        setPairWrongTranslation(null);
        setPairLeftSelected(null);
        setPairRightSelected(null);
        return;
      }

      setPairWrongWord(word);
      setPairWrongTranslation(translation);
      setPairLeftSelected(null);
      setPairRightSelected(null);
      window.setTimeout(() => {
        setPairWrongWord((prev) => (prev === word ? null : prev));
        setPairWrongTranslation((prev) => (normalize(prev ?? '') === normalize(translation) ? null : prev));
      }, 1000);
    };

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {pairs.map((pair) => {
              const selected = pairLeftSelected === pair.word;
              const matchedTranslation = pairMatches[pair.word];
              const isCorrect = reinforcementChecked && normalize(matchedTranslation ?? '') === normalize(pair.translation);
              const isWrong = reinforcementChecked && matchedTranslation && !isCorrect;
              const isLockedCorrect = normalize(matchedTranslation ?? '') === normalize(pair.translation);
              const isTempWrong = pairWrongWord === pair.word;

              return (
                <button
                  key={pair.word}
                  type="button"
                  onClick={() => {
                    if (reinforcementChecked) return;
                    void playAudioUrl(pair.pronunciationAudioUrl ?? null);
                    if (isLockedCorrect) return;
                    if (pairRightSelected) {
                      checkAndAssignPair(pair.word, pairRightSelected);
                      return;
                    }
                    setPairLeftSelected((prev) => (prev === pair.word ? null : pair.word));
                  }}
                  style={{
                    border: `1px solid ${
                      isLockedCorrect || isCorrect
                        ? 'rgba(67, 201, 127, 0.7)'
                        : isTempWrong
                        ? 'rgba(255, 95, 109, 0.8)'
                        : isWrong
                        ? 'rgba(255, 95, 109, 0.7)'
                        : selected
                        ? 'rgba(46, 163, 255, 0.75)'
                        : 'var(--tg-border)'
                    }`,
                    borderRadius: 12,
                    background: 'var(--tg-card)',
                    color: 'var(--tg-text)',
                    padding: '10px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 16,
                    animation: isTempWrong ? 'slot-shake 1s ease-in-out 1' : undefined,
                    borderWidth: isLockedCorrect || isCorrect || isTempWrong || isWrong ? 3 : 1,
                  }}
                >
                  {pair.word}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {shuffledTranslations.map((translation, index) => {
              const takenBy = Object.entries(pairMatches).find(([, tr]) => normalize(tr) === normalize(translation))?.[0] ?? null;
              const isTempWrong = normalize(pairWrongTranslation ?? '') === normalize(translation);
              const isLockedCorrect = Boolean(takenBy);
              const isSelected = normalize(pairRightSelected ?? '') === normalize(translation);
              const disabled = reinforcementChecked || isLockedCorrect;

              return (
                <button
                  key={`${translation}-${index}`}
                  type="button"
                  onClick={() => {
                    if (reinforcementChecked || isLockedCorrect) return;
                    if (pairLeftSelected) {
                      checkAndAssignPair(pairLeftSelected, translation);
                      return;
                    }
                    setPairRightSelected((prev) =>
                      normalize(prev ?? '') === normalize(translation) ? null : translation,
                    );
                  }}
                  disabled={disabled}
                  style={{
                    border: `1px solid ${
                      isLockedCorrect
                        ? 'rgba(67, 201, 127, 0.7)'
                        : isTempWrong
                        ? 'rgba(255, 95, 109, 0.8)'
                        : isSelected
                        ? 'rgba(46, 163, 255, 0.75)'
                        : 'var(--tg-border)'
                    }`,
                    borderRadius: 12,
                    background: 'var(--tg-card)',
                    color: 'var(--tg-text)',
                    padding: '10px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 16,
                    opacity: reinforcementChecked ? 0.6 : 1,
                    animation: isTempWrong ? 'slot-shake 1s ease-in-out 1' : undefined,
                    borderWidth: isLockedCorrect || isTempWrong ? 3 : 1,
                  }}
                >
                  {translation}
                </button>
              );
            })}
          </div>
        </div>

        {reinforcementChecked && (
          <div
            style={{
              borderRadius: 12,
              padding: 10,
              border: `1px solid ${isReinforcementCorrect ? 'rgba(67, 201, 127, 0.6)' : 'rgba(255, 95, 109, 0.6)'}`,
              background: isReinforcementCorrect ? 'rgba(67, 201, 127, 0.12)' : 'rgba(255, 95, 109, 0.12)',
              fontWeight: 700,
            }}
          >
            {isReinforcementCorrect ? 'Правильно' : 'Неправильно'}
          </div>
        )}
      </>
    );
  };

  const renderReinforcement = (reinforcement: ReinforcementTask) => (
    <div className="section" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>
          {reinforcement.reinforcement.type === 'match_pairs'
            ? 'Соедини слова и их перевод'
            : reinforcement.reinforcement.type === 'missing'
            ? 'Вставь пропущенное слово'
            : reinforcement.reinforcement.type === 'audio_assemble'
            ? 'Собери фразу из слов'
            : 'Закрепление'}
        </strong>
      </div>

      {reinforcement.reinforcement.type === 'audio_assemble' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={() => void playPronunciation(reinforcement)}
            disabled={!reinforcement.pronunciationAudioUrl}
            aria-label="Проиграть произношение"
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
              opacity: reinforcement.pronunciationAudioUrl ? 1 : 0.45,
            }}
          >
            <Volume2 size={18} />
          </button>
        </div>
      )}

      {reinforcement.reinforcement.type === 'missing' && renderMissingExercise(reinforcement)}
      {reinforcement.reinforcement.type === 'audio_assemble' && renderAudioAssembleExercise(reinforcement)}
      {reinforcement.reinforcement.type === 'match_pairs' && renderMatchPairsExercise(reinforcement)}

      {reinforcement.reinforcement.type === 'match_pairs' ? (
        <Button onClick={submitReinforcement} disabled={submitting || !isReinforcementCorrect}>
          Далее
        </Button>
      ) : (
        <Button onClick={submitReinforcement} disabled={submitting || (!reinforcementChecked && !canCheckReinforcement)}>
          {reinforcementChecked ? 'Далее' : 'Проверить'}
        </Button>
      )}
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
        {session?.status === 'active' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => void finishEarly()}
              disabled={submitting}
              aria-label="Завершить урок"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: '1px solid transparent',
                background: 'transparent',
                color: 'var(--tg-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              <X size={24} />
            </button>
            <div
              style={{
                height: 14,
                flex: 1,
                background: 'var(--tg-border)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${lessonProgressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8fdc3f, #7ac734)',
                  transition: 'width 220ms ease',
                }}
              />
            </div>
          </div>
        )}

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

      </div>
    </PageShell>
  );
}

