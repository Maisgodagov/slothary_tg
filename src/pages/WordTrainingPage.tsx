import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Volume2, X, XCircle } from 'lucide-react';

import { useAppSelector } from '../app/hooks';
import { selectAuth } from '../features/auth/slice';
import {
  type WordTrainingContext,
  type RecognitionTask,
  type ReinforcementTask,
  type WordTrainingOverview,
  type WordTrainingState,
  wordTrainingApi,
} from '../features/word-training/api';
import type { PhraseSnippet } from '../features/video-dictionary/api';
import { SnippetCarousel } from '../modules/dictionary/components/SnippetCarousel';
import { Button } from '../shared/ui/Button';
import { PageShell } from '../shared/ui/PageShell';

const normalize = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]+/gu, '')
    .replace(/\s+/g, ' ');

const normalizeLoose = (value: string): string => normalize(value.replace(/[.,!?;:]/g, ' '));
const isWordToken = (value: string): boolean => /^[A-Za-z][A-Za-z'-]*$/.test(value);
const CEFR_LEVELS: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'> = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

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
  const [missingSelected, setMissingSelected] = useState<[string | null, string | null]>([null, null]);
  const [pairMatches, setPairMatches] = useState<Record<string, string>>({});
  const [pairLeftSelected, setPairLeftSelected] = useState<string | null>(null);
  const [pairRightSelected, setPairRightSelected] = useState<string | null>(null);
  const [pairWrongWord, setPairWrongWord] = useState<string | null>(null);
  const [pairWrongTranslation, setPairWrongTranslation] = useState<string | null>(null);
  const [reinforcementChecked, setReinforcementChecked] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const feedbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const [practiceView, setPracticeView] = useState<{
    word: string;
    snippets: PhraseSnippet[];
    nextMode: 'recognition' | 'reinforcement';
    recognitionTask?: RecognitionTask | null;
  } | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [postPracticeTransitioning, setPostPracticeTransitioning] = useState(false);
  const [introducedWordKeys, setIntroducedWordKeys] = useState<Record<string, true>>({});
  const snippetShownWordsRef = useRef<Set<string>>(new Set());
  const recognitionDoneWordsRef = useRef<Set<string>>(new Set());
  const lastStepHadSnippetRef = useRef(false);
  const trainingListRef = useRef<HTMLDivElement | null>(null);
  const currentTrainingRef = useRef<HTMLDivElement | null>(null);

  const session = state?.session ?? null;
  const task = state?.task ?? null;
  const taskId = task?.itemId ?? null;
  const completedWords = state?.summary?.completedWords ?? [];
  const userLevel = (auth.profile?.level || 'A1').toUpperCase();
  const currentLevelIndex = Math.max(0, CEFR_LEVELS.indexOf(userLevel as (typeof CEFR_LEVELS)[number]));
  const trainingPlan = useMemo(() => {
    if (!overview) {
      return {
        targetWords: 5,
        totalSessions: 1,
        completedSessions: 0,
        nextSession: 1,
        dayGoal: 3,
        weekGoal: 21,
        monthGoal: 90,
      };
    }
    const targetWords = Math.max(1, overview.suggestedTargetWords || 5);
    const dayWordPool = Math.max(0, overview.dueCount + overview.mistakeCount + Math.min(overview.newCount, 24));
    const totalSessions = Math.max(1, Math.min(12, Math.ceil(dayWordPool / targetWords)));
    const completedSessions = Math.min(totalSessions, Math.max(0, overview.todayProgress.sessionsDone || 0));
    const nextSession = Math.min(totalSessions, completedSessions + 1);
    const dayGoal = Math.max(3, Math.min(8, totalSessions));
    const weekGoal = dayGoal * 7;
    const monthGoal = dayGoal * 30;
    return {
      targetWords,
      totalSessions,
      completedSessions,
      nextSession,
      dayGoal,
      weekGoal,
      monthGoal,
    };
  }, [overview]);
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

  useEffect(() => {
    if (loading || session || !overview) return;
    if (!trainingListRef.current || !currentTrainingRef.current) return;
    const raf = window.requestAnimationFrame(() => {
      currentTrainingRef.current?.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: 'auto',
      });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [
    loading,
    session,
    overview,
    userLevel,
    trainingPlan.totalSessions,
    trainingPlan.completedSessions,
    trainingPlan.nextSession,
  ]);

  const optionButtonBaseStyle = {
    minHeight: 48,
    borderRadius: 18,
    padding: '10px 12px',
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.1,
    borderStyle: 'solid',
    borderWidth: 3,
    borderColor: 'var(--tg-border)',
  } as const;

  const slotBaseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 82,
    minHeight: 40,
    borderRadius: 18,
    border: '3px dashed var(--tg-border)',
    margin: '0 6px',
    verticalAlign: 'middle',
    color: 'var(--tg-text)',
    fontSize: 22,
    fontWeight: 700,
    padding: '4px 12px',
    background: 'rgba(255,255,255,0.03)',
  } as const;

  const missingExerciseModel = useMemo(() => {
    if (!task || task.mode !== 'reinforcement' || task.reinforcement.type !== 'missing') return null;

    const sentence = task.reinforcement.sentence ?? '';
    const rawTokens = sentence.match(/[A-Za-z][A-Za-z'-]*|[^A-Za-z]+/g) ?? [sentence];
    const wordIndexes = rawTokens
      .map((token, index) => (isWordToken(token) ? index : -1))
      .filter((index) => index >= 0);

    const correctWordNorm = normalize(task.reinforcement.correctWord ?? '');
    let firstIndex = wordIndexes.find((index) => normalize(rawTokens[index] ?? '') === correctWordNorm) ?? -1;
    if (firstIndex < 0) firstIndex = wordIndexes[0] ?? 0;

    const secondIndex =
      wordIndexes.find(
        (index) =>
          index !== firstIndex &&
          normalize(rawTokens[index] ?? '') !== correctWordNorm &&
          (rawTokens[index]?.length ?? 0) > 2,
      ) ??
      wordIndexes.find((index) => index !== firstIndex) ??
      firstIndex;

    const blankIndexes = [firstIndex, secondIndex].sort((a, b) => a - b);
    const expectedWords: [string, string] = [
      rawTokens[blankIndexes[0]] ?? '',
      rawTokens[blankIndexes[1]] ?? '',
    ];

    const distractors = (task.reinforcement.options ?? [])
      .filter((option) => !expectedWords.some((word) => normalize(word) === normalize(option)))
      .slice(0, 4);
    const options = [...expectedWords, ...distractors]
      .filter((option, index, arr) => arr.findIndex((item) => normalize(item) === normalize(option)) === index)
      .sort(() => Math.random() - 0.5);

    return { rawTokens, blankIndexes, expectedWords, options };
  }, [task]);

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

  const mapContextToSnippet = useCallback(
    (item: WordTrainingContext, index: number, word: string): PhraseSnippet | null => {
      if (!item.videoUrl?.trim()) return null;
      const start = Number.isFinite(item.startSeconds as number) ? Number(item.startSeconds) : 0;
      const endRaw = Number.isFinite(item.endSeconds as number) ? Number(item.endSeconds) : start + 6;
      const end = endRaw > start ? endRaw : start + 6;
      const contextText = item.text?.trim() || word;
      return {
        id: `${item.contentId}-${start}-${end}-${index}`,
        contentId: String(item.contentId),
        videoName: item.videoName || 'Видео',
        videoUrl: item.videoUrl,
        startSeconds: start,
        endSeconds: end,
        matchedText: word,
        contextText,
        phrase: word,
        durationSeconds: end - start,
      };
    },
    [],
  );

  const loadPracticeSnippets = useCallback(
    async (word: string): Promise<PhraseSnippet[]> => {
      try {
        const response = await wordTrainingApi.getExamples(word, userId, 30, 2, 2, 4);
        return (response.items ?? [])
          .map((item, index) => mapContextToSnippet(item, index, word))
          .filter((item): item is PhraseSnippet => Boolean(item))
          .slice(0, 30);
      } catch {
        return [];
      }
    },
    [mapContextToSnippet, userId],
  );

  const openPracticeBetweenSteps = useCallback(
    async (params: { word: string; nextMode: 'recognition' | 'reinforcement'; recognitionTask?: RecognitionTask | null }) => {
      setPracticeLoading(true);
      const snippets = await loadPracticeSnippets(params.word);
      setPracticeView({
        word: params.word,
        snippets,
        nextMode: params.nextMode,
        recognitionTask: params.recognitionTask ?? null,
      });
      setPracticeLoading(false);
    },
    [loadPracticeSnippets],
  );

  const continueAfterPractice = useCallback(async () => {
    if (!practiceView) return;
    const payload = practiceView;
    setPostPracticeTransitioning(true);
    setPracticeView(null);
    try {
      if (payload.nextMode === 'recognition' && payload.recognitionTask) {
        await submitRecognitionResult(payload.recognitionTask);
        return;
      }
      await submitReinforcement();
    } finally {
      setPostPracticeTransitioning(false);
    }
  }, [practiceView]);

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

  const playFeedbackSound = useCallback(async (isCorrect: boolean) => {
    const baseUrl = import.meta.env.BASE_URL ?? '/';
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const soundUrl = `${normalizedBase}sounds/${isCorrect ? 'right.wav' : 'wrong.wav'}`;
    if (feedbackAudioRef.current) {
      try {
        feedbackAudioRef.current.pause();
        feedbackAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }

    const sound = new Audio(soundUrl);
    sound.preload = 'auto';
    feedbackAudioRef.current = sound;
    try {
      await sound.play();
    } catch {
      // ignore
    }
  }, []);

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
    setMissingSelected([null, null]);
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

  useEffect(() => {
    snippetShownWordsRef.current = new Set();
    recognitionDoneWordsRef.current = new Set();
    lastStepHadSnippetRef.current = false;
    setPracticeView(null);
    setPracticeLoading(false);
    setPostPracticeTransitioning(false);
    setIntroducedWordKeys({});
  }, [session?.id]);

  useEffect(
    () => () => {
      if (!feedbackAudioRef.current) return;
      try {
        feedbackAudioRef.current.pause();
        feedbackAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      feedbackAudioRef.current = null;
    },
    [],
  );

  const startOrResume = async () => {
    if (!userId) return;
    setSubmitting(true);
    setError(null);

    try {
      const userLevelRaw = auth.profile?.level;
      const userLevel =
        userLevelRaw === 'A1' ||
        userLevelRaw === 'A2' ||
        userLevelRaw === 'B1' ||
        userLevelRaw === 'B2' ||
        userLevelRaw === 'C1' ||
        userLevelRaw === 'C2'
          ? userLevelRaw
          : 'A1';
      const targetWords = Math.min(5, Math.max(1, overview?.suggestedTargetWords ?? 5));
      const result = await wordTrainingApi.startSession(
        {
          targetWords,
          preferences: {
            cefrLevel: userLevel,
            maxUniqueWords: 5,
            maxMatchPairsPerSession: 1,
            prioritizeUserInteractions: true,
            levelMix: {
              currentLevelWeight: 0.7,
              lowerLevelWeight: 0.15,
              higherLevelWeight: 0.15,
            },
            reinforcementMode: {
              phraseExercisesPerWord: 2,
              retryMistakesAtEnd: true,
            },
          },
        },
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

  const submitRecognitionResult = async (recognition: RecognitionTask): Promise<boolean> => {
    if (!userId || !session) return false;
    if (!recognitionSelected) return false;

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
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить ответ');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const proceedAfterRecognition = useCallback(
    async (recognition: RecognitionTask) => {
      lastStepHadSnippetRef.current = false;
      const success = await submitRecognitionResult(recognition);
      if (!success) return;
      const wordKey = normalize(recognition.word);
      if (wordKey) recognitionDoneWordsRef.current.add(wordKey);
    },
    [submitRecognitionResult],
  );

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
      if (!missingExerciseModel) return false;
      return (
        normalize(missingSelected[0] ?? '') === normalize(missingExerciseModel.expectedWords[0] ?? '') &&
        normalize(missingSelected[1] ?? '') === normalize(missingExerciseModel.expectedWords[1] ?? '')
      );
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
  }, [assembleAnswer, missingExerciseModel, missingSelected, pairMatches, task]);

  const canCheckReinforcement = useMemo(() => {
    if (!task || task.mode !== 'reinforcement') return false;
    const type = task.reinforcement.type;

    if (type === 'missing') return Boolean(missingSelected[0] && missingSelected[1]);
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
      void playFeedbackSound(isReinforcementCorrect);
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

  const proceedAfterReinforcement = useCallback(
    async (reinforcementTask: ReinforcementTask) => {
      const wordKey = normalize(reinforcementTask.word);
      const isPhraseExercise =
        reinforcementTask.reinforcement.type === 'missing' ||
        reinforcementTask.reinforcement.type === 'audio_assemble';
      const canShowPractice =
        Boolean(wordKey) &&
        isPhraseExercise &&
        recognitionDoneWordsRef.current.has(wordKey) &&
        !snippetShownWordsRef.current.has(wordKey) &&
        !lastStepHadSnippetRef.current;

      if (canShowPractice) {
        snippetShownWordsRef.current.add(wordKey!);
        lastStepHadSnippetRef.current = true;
        await openPracticeBetweenSteps({
          word: reinforcementTask.word,
          nextMode: 'reinforcement',
        });
        return;
      }

      lastStepHadSnippetRef.current = false;
      await submitReinforcement();
    },
    [openPracticeBetweenSteps, submitReinforcement],
  );

  const renderRecognition = (recognition: RecognitionTask) => {
    const options: string[] =
      recognition.recognitionOptions?.length > 0
        ? recognition.recognitionOptions
        : [recognition.translation];

    return (
      <div className="section" style={{ display: 'grid', gap: 12, borderRadius: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <strong style={{ fontSize: 25, lineHeight: 1.15, fontWeight: 600 }}>Выбери правильный перевод</strong>
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
              borderRadius: 16,
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 18 }}>
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
                    void playFeedbackSound(true);
                    setRecognitionSelected(option);
                    setRecognitionChecked(true);
                    setRecognitionWrongOption(null);
                    setRecognitionResult('correct');
                    return;
                  }
                  void playFeedbackSound(false);
                  setRecognitionSelected(option);
                  setRecognitionChecked(true);
                  setRecognitionWrongOption(option);
                  setRecognitionResult('wrong');
                }}
                disabled={submitting || recognitionChecked}
                className={showWrong ? 'slot-shake' : undefined}
                style={{
                  ...optionButtonBaseStyle,
                  borderColor: showCorrect
                    ? 'rgba(67, 201, 127, 0.9)'
                    : showWrong
                    ? 'rgba(255, 95, 109, 0.9)'
                    : 'var(--tg-border)',
                  borderWidth: 3,
                }}
              >
                {option}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNewWordIntro = (recognition: RecognitionTask) => {
    const otherTranslations = (recognition.otherTranslations ?? [])
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);

    return (
      <div className="section" style={{ display: 'grid', gap: 14, borderRadius: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: 25, lineHeight: 1.15, fontWeight: 600 }}>Новое слово</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>
            {recognition.word} <span style={{ color: 'var(--tg-subtle)', fontWeight: 700 }}>-</span>{' '}
            <span style={{ fontSize: 30 }}>{recognition.translation}</span>
          </div>
          <button
            type="button"
            onClick={() => void playPronunciation(recognition)}
            disabled={!recognition.pronunciationAudioUrl}
            aria-label="Проиграть произношение"
            style={{
              width: 42,
              height: 42,
              borderRadius: 16,
              border: '1px solid var(--tg-border)',
              background: 'var(--tg-card)',
              color: 'var(--tg-text)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: recognition.pronunciationAudioUrl ? 1 : 0.45,
              flexShrink: 0,
            }}
          >
            <Volume2 size={19} />
          </button>
        </div>

        {otherTranslations.length ? (
          <div style={{ color: 'var(--tg-subtle)', fontSize: 14, lineHeight: 1.45 }}>
            {otherTranslations.join(', ')}
          </div>
        ) : null}

        <Button
          onClick={() => {
            setIntroducedWordKeys((prev) => ({ ...prev, [recognition.wordKey]: true }));
          }}
          style={{
            width: '100%',
            minHeight: 52,
            borderRadius: 14,
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          Понятно
        </Button>
      </div>
    );
  };

  const renderMissingExercise = (_reinforcement: ReinforcementTask) => {
    if (!missingExerciseModel) return null;
    const options = missingExerciseModel.options;
    const { rawTokens, blankIndexes } = missingExerciseModel;

    return (
      <>
        <div
          style={{
            minHeight: 56,
            padding: 4,
            fontSize: 23,
            fontWeight: 700,
            lineHeight: 1.28,
          }}
        >
          {rawTokens.map((token, index) => {
            const slotIndex = blankIndexes.findIndex((blankIndex) => blankIndex === index);
            if (slotIndex >= 0) {
              const isSlotCorrect =
                reinforcementChecked &&
                normalize(missingSelected[slotIndex] ?? '') ===
                  normalize(missingExerciseModel.expectedWords[slotIndex] ?? '');
              const isSlotWrong = reinforcementChecked && !isSlotCorrect;
              return (
                <span
                  key={`blank-${index}`}
                  className={isSlotWrong ? 'slot-shake' : undefined}
                  onClick={() => {
                    if (reinforcementChecked || !missingSelected[slotIndex]) return;
                    setMissingSelected((prev) => {
                      const next: [string | null, string | null] = [...prev] as [string | null, string | null];
                      next[slotIndex] = null;
                      return next;
                    });
                  }}
                  style={{
                    ...slotBaseStyle,
                    border: reinforcementChecked
                      ? isSlotCorrect
                        ? '3px solid rgba(67, 201, 127, 0.85)'
                        : '3px solid rgba(255, 95, 109, 0.9)'
                      : slotBaseStyle.border,
                    background: reinforcementChecked
                      ? isSlotCorrect
                        ? 'rgba(67, 201, 127, 0.12)'
                        : 'rgba(255, 95, 109, 0.12)'
                      : slotBaseStyle.background,
                    cursor: !reinforcementChecked && missingSelected[slotIndex] ? 'pointer' : 'default',
                  }}
                >
                  {missingSelected[slotIndex] ?? ''}
                </span>
              );
            }
            return <span key={`text-${index}`}>{token}</span>;
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 18 }}>
          {options.map((option, index) => {
            const usedCount = missingSelected.filter((value) => normalize(value ?? '') === normalize(option)).length;
            const canReuse =
              missingExerciseModel.expectedWords.filter((word) => normalize(word) === normalize(option)).length > usedCount;
            const disabledByUse = usedCount > 0 && !canReuse;
            return (
              <Button
                key={`${option}-${index}`}
                variant="ghost"
                onClick={() => {
                  if (reinforcementChecked) return;
                  setMissingSelected((prev) => {
                    if (disabledByUse) return prev;
                    const emptyIndex = prev.findIndex((value) => !value);
                    if (emptyIndex < 0) return prev;
                    const next: [string | null, string | null] = [...prev] as [string | null, string | null];
                    next[emptyIndex] = option;
                    return next;
                  });
                }}
                disabled={submitting || reinforcementChecked || disabledByUse}
                style={{ ...optionButtonBaseStyle, opacity: disabledByUse ? 0.55 : 1 }}
              >
                {option}
              </Button>
            );
          })}
        </div>

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
          <div
            style={{
              fontSize: 'clamp(30px, 7vw, 38px)',
              fontWeight: 800,
              lineHeight: 1.14,
              letterSpacing: '-0.02em',
              margin: '4px 0 10px',
            }}
          >
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
                  ...slotBaseStyle,
                  border: isSlotCorrect
                    ? '3px solid rgba(67, 201, 127, 0.7)'
                    : isSlotWrong
                    ? '3px solid rgba(255, 95, 109, 0.7)'
                    : slotBaseStyle.border,
                  background:
                    isSlotCorrect
                      ? 'rgba(67, 201, 127, 0.12)'
                      : isSlotWrong
                      ? 'rgba(255, 95, 109, 0.12)'
                      : slotBaseStyle.background,
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
                  ...optionButtonBaseStyle,
                  border: '1px solid var(--tg-border)',
                  background: disabled ? 'rgba(255,255,255,0.02)' : 'var(--tg-card)',
                  color: 'var(--tg-text)',
                  opacity: disabled ? 0.55 : 1,
                }}
              >
                {token}
              </button>
            );
          })}
        </div>

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
        void playFeedbackSound(true);
        setPairMatches((prev) => ({ ...prev, [word]: translation }));
        setPairWrongWord(null);
        setPairWrongTranslation(null);
        setPairLeftSelected(null);
        setPairRightSelected(null);
        return;
      }

      void playFeedbackSound(false);
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
          <div style={{ display: 'grid', gap: 12 }}>
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
                    ...optionButtonBaseStyle,
                    minHeight: 56,
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
                    background: 'var(--tg-card)',
                    color: 'var(--tg-text)',
                    textAlign: 'left',
                    padding: '12px 14px',
                    animation: isTempWrong ? 'slot-shake 1s ease-in-out 1' : undefined,
                    borderWidth: isLockedCorrect || isCorrect || isTempWrong || isWrong ? 3 : 1,
                  }}
                >
                  {pair.word}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
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
                    ...optionButtonBaseStyle,
                    minHeight: 56,
                    border: `1px solid ${
                      isLockedCorrect
                        ? 'rgba(67, 201, 127, 0.7)'
                        : isTempWrong
                        ? 'rgba(255, 95, 109, 0.8)'
                        : isSelected
                        ? 'rgba(46, 163, 255, 0.75)'
                        : 'var(--tg-border)'
                    }`,
                    background: 'var(--tg-card)',
                    color: 'var(--tg-text)',
                    textAlign: 'left',
                    padding: '12px 14px',
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

      </>
    );
  };

  const renderBottomActionPanel = (params: {
    visible: boolean;
    isCorrect: boolean;
    title: string;
    subtitle?: string | null;
    onNext: () => void;
  }) => {
    if (!params.visible) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
      <div
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 560,
          bottom: 'calc(54px + var(--tg-safe-area-inset-bottom, 0px))',
          zIndex: 40,
          borderRadius: '18px 18px 0 0',
          border: '1px solid var(--tg-border)',
          borderBottom: 'none',
          background: 'var(--tg-card)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.26)',
          padding: '12px 12px 10px',
          display: 'grid',
          gap: 10,
        }}
      >
        <div
          style={{
            borderRadius: 12,
            padding: '10px 12px',
            border: `1px solid ${params.isCorrect ? 'rgba(67, 201, 127, 0.65)' : 'rgba(255, 95, 109, 0.65)'}`,
            background: params.isCorrect ? 'rgba(67, 201, 127, 0.12)' : 'rgba(255, 95, 109, 0.12)',
            display: 'grid',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            {params.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {params.title}
          </div>
          {params.subtitle ? (
            <div style={{ color: 'var(--tg-subtle)', fontWeight: 600 }}>{params.subtitle}</div>
          ) : null}
        </div>

        <Button
          onClick={params.onNext}
          disabled={submitting}
          style={{ minHeight: 50, fontSize: 22, fontWeight: 700, borderRadius: 14, background: '#2ea3ff', boxShadow: 'none' }}
        >
          Далее
        </Button>
      </div>,
      document.body,
    );
  };

  const renderReinforcement = (reinforcement: ReinforcementTask) => (
    <div className="section" style={{ display: 'grid', gap: 12, borderRadius: 22 }}>
      {(() => {
        const isMatchPairs = reinforcement.reinforcement.type === 'match_pairs';
        return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong
          style={
            isMatchPairs
              ? { fontSize: 25, lineHeight: 1.15, fontWeight: 600, marginBottom: 24, display: 'inline-block' }
              : reinforcement.reinforcement.type === 'missing'
              ? { fontSize: 25, lineHeight: 1.15, fontWeight: 600, marginBottom: 20, display: 'inline-block' }
              : undefined
          }
        >
          {reinforcement.reinforcement.type === 'match_pairs'
            ? 'Соедини слова и их перевод'
            : reinforcement.reinforcement.type === 'missing'
            ? 'Вставь пропущенное слово'
            : reinforcement.reinforcement.type === 'audio_assemble'
            ? 'Собери фразу из слов'
            : 'Закрепление'}
        </strong>
      </div>
        );
      })()}

      {(reinforcement.reinforcement.type === 'audio_assemble' || reinforcement.reinforcement.type === 'missing') && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={() =>
              void playAudioUrl(
                reinforcement.reinforcement.type === 'missing'
                  ? reinforcement.reinforcement.phraseAudioUrl ?? null
                  : reinforcement.pronunciationAudioUrl ?? null,
              )
            }
            disabled={
              reinforcement.reinforcement.type === 'missing'
                ? !reinforcement.reinforcement.phraseAudioUrl
                : !reinforcement.pronunciationAudioUrl
            }
            aria-label="Проиграть аудио"
            style={{
              width: 40,
              height: 40,
              borderRadius: 16,
              border: '1px solid var(--tg-border)',
              background: 'var(--tg-card)',
              color: 'var(--tg-text)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity:
                reinforcement.reinforcement.type === 'missing'
                  ? reinforcement.reinforcement.phraseAudioUrl
                    ? 1
                    : 0.45
                  : reinforcement.pronunciationAudioUrl
                  ? 1
                  : 0.45,
            }}
          >
            <Volume2 size={18} />
          </button>
        </div>
      )}

      {reinforcement.reinforcement.type === 'missing' && renderMissingExercise(reinforcement)}
      {reinforcement.reinforcement.type === 'audio_assemble' && renderAudioAssembleExercise(reinforcement)}
      {reinforcement.reinforcement.type === 'match_pairs' && renderMatchPairsExercise(reinforcement)}

      {reinforcement.reinforcement.type !== 'match_pairs' && !reinforcementChecked ? (
        <Button
          onClick={submitReinforcement}
          disabled={submitting || (!reinforcementChecked && !canCheckReinforcement)}
          style={
            !reinforcementChecked
              ? { background: '#2ea3ff', boxShadow: 'none' }
              : undefined
          }
        >
          {reinforcementChecked ? 'Далее' : 'Проверить'}
        </Button>
      ) : null}
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
      <div
        style={{
          padding: 14,
          display: 'grid',
          gap: 12,
          paddingBottom: 'calc(70px + var(--tg-safe-area-inset-bottom, 0px))',
        }}
      >
        {session?.status === 'active' && (
          <div style={{ display: 'grid', gap: 10 }}>
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
            {!loading && state?.retryPhase && (
              <div
                className="section"
                style={{
                  borderRadius: 16,
                  padding: 10,
                  fontWeight: 700,
                  background: 'rgba(255, 196, 64, 0.08)',
                  border: '1px solid rgba(255, 196, 64, 0.45)',
                }}
              >
                {state.retryPhaseTitle ?? 'Закрепляем ошибки'}
              </div>
            )}
          </div>
        )}

        {error && <div className="section" style={{ color: 'var(--tg-danger)' }}>{error}</div>}
        {loading && <div className="section">Загрузка...</div>}

        {(() => {
          if (!session || !task || task.mode !== 'recognition') return null;
          if (!task.isNewWord) return null;
          if (introducedWordKeys[task.wordKey]) return null;
          if (practiceView || postPracticeTransitioning) return null;
          return renderNewWordIntro(task);
        })()}

        {!loading && !session && overview && (
          <>
            <div
              className="section"
              style={{
                display: 'grid',
                gap: 12,
                borderRadius: 24,
                padding: 14,
                background:
                  'radial-gradient(120% 70% at 50% -5%, rgba(78,197,255,0.2) 0%, rgba(29,39,74,0.96) 58%, rgba(14,19,38,1) 100%)',
                border: '1px solid rgba(78,197,255,0.24)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.1 }}>Твоя тренировка</div>
                <span
                  style={{
                    borderRadius: 999,
                    border: '1px solid rgba(78,197,255,0.42)',
                    color: '#9ddfff',
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '5px 10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Уровень {userLevel}
                </span>
              </div>
              <div style={{ color: 'var(--tg-subtle)', fontSize: 14 }}>
                Изучай шаг за шагом: открывай тренировки подряд и поднимайся по CEFR.
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    borderRadius: 14,
                    border: '1px solid var(--tg-border)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '8px 8px 7px',
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{overview.todayProgress.wordsDone}</div>
                  <div style={{ color: 'var(--tg-subtle)', fontSize: 11, fontWeight: 700 }}>слов сегодня</div>
                </div>
                <div
                  style={{
                    borderRadius: 14,
                    border: '1px solid var(--tg-border)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '8px 8px 7px',
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{overview.todayProgress.xpGained}</div>
                  <div style={{ color: 'var(--tg-subtle)', fontSize: 11, fontWeight: 700 }}>XP сегодня</div>
                </div>
                <div
                  style={{
                    borderRadius: 14,
                    border: '1px solid var(--tg-border)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '8px 8px 7px',
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{overview.trackedWords}</div>
                  <div style={{ color: 'var(--tg-subtle)', fontSize: 11, fontWeight: 700 }}>слов в треке</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>Путь по CEFR</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 6 }}>
                  {CEFR_LEVELS.map((level, index) => {
                    const isPassed = index < currentLevelIndex;
                    const isCurrent = index === currentLevelIndex;
                    const isLocked = index > currentLevelIndex;
                    return (
                      <div
                        key={level}
                        style={{
                          borderRadius: 12,
                          border: `1px solid ${
                            isCurrent ? 'rgba(78,197,255,0.75)' : isPassed ? 'rgba(67, 201, 127, 0.65)' : 'var(--tg-border)'
                          }`,
                          background: isCurrent
                            ? 'rgba(46,163,255,0.14)'
                            : isPassed
                            ? 'rgba(67,201,127,0.1)'
                            : 'rgba(255,255,255,0.02)',
                          color: isLocked ? 'var(--tg-subtle)' : 'var(--tg-text)',
                          filter: isLocked ? 'grayscale(0.6)' : 'none',
                          opacity: isLocked ? 0.58 : 1,
                          textAlign: 'center',
                          padding: '7px 0',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {level}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>План активности</div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 8,
                    color: 'var(--tg-subtle)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <div style={{ borderRadius: 12, border: '1px solid var(--tg-border)', padding: '7px 8px' }}>
                    День: {Math.min(trainingPlan.dayGoal, overview.todayProgress.sessionsDone)}/{trainingPlan.dayGoal}
                  </div>
                  <div style={{ borderRadius: 12, border: '1px solid var(--tg-border)', padding: '7px 8px' }}>
                    Неделя: {Math.min(trainingPlan.weekGoal, overview.todayProgress.sessionsDone)}/{trainingPlan.weekGoal}
                  </div>
                  <div style={{ borderRadius: 12, border: '1px solid var(--tg-border)', padding: '7px 8px' }}>
                    Месяц: {Math.min(trainingPlan.monthGoal, overview.todayProgress.sessionsDone)}/{trainingPlan.monthGoal}
                  </div>
                </div>
              </div>
            </div>

            <div className="section" style={{ display: 'grid', gap: 10, borderRadius: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Тренировки уровня {userLevel}</div>
              <div style={{ color: 'var(--tg-subtle)', fontSize: 13 }}>
                Проходи тренировки по порядку. Следующая открывается после завершения предыдущей.
              </div>
              <div
                ref={trainingListRef}
                style={{
                  display: 'grid',
                  gap: 8,
                  maxHeight: 'min(56svh, 560px)',
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {Array.from({ length: trainingPlan.totalSessions }).map((_, index) => {
                  const number = index + 1;
                  const isCompleted = number <= trainingPlan.completedSessions;
                  const isNext = number === trainingPlan.nextSession && !isCompleted;
                  const isCurrentLesson =
                    number ===
                    (trainingPlan.completedSessions >= trainingPlan.totalSessions
                      ? trainingPlan.totalSessions
                      : trainingPlan.nextSession);
                  const isLocked = !isCompleted && !isNext;
                  return (
                    <div
                      key={`session-${number}`}
                      ref={isCurrentLesson ? currentTrainingRef : null}
                      style={{
                        borderRadius: 14,
                        border: `1px solid ${
                          isCompleted ? 'rgba(67,201,127,0.65)' : isNext ? 'rgba(78,197,255,0.55)' : 'var(--tg-border)'
                        }`,
                        background: isCompleted
                          ? 'rgba(67,201,127,0.1)'
                          : isNext
                          ? 'rgba(46,163,255,0.1)'
                          : 'rgba(255,255,255,0.02)',
                        padding: '9px 10px',
                        opacity: isLocked ? 0.55 : 1,
                        filter: isLocked ? 'grayscale(0.5)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>
                          Тренировка {number}
                        </div>
                        <div style={{ color: 'var(--tg-subtle)', fontSize: 12 }}>
                          ~{trainingPlan.targetWords} слов • {isCompleted ? 'Пройдена' : isNext ? 'Доступна сейчас' : 'Закрыта'}
                        </div>
                      </div>
                      {isCompleted ? (
                        <span style={{ color: '#79dca3', fontSize: 12, fontWeight: 800 }}>Готово</span>
                      ) : isNext ? (
                        <Button onClick={startOrResume} disabled={submitting} style={{ minHeight: 34, padding: '0 12px', fontSize: 14 }}>
                          Начать
                        </Button>
                      ) : (
                        <span style={{ color: 'var(--tg-subtle)', fontSize: 12, fontWeight: 700 }}>Заблок.</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!loading &&
          !postPracticeTransitioning &&
          session &&
          task &&
          task.mode === 'recognition' &&
          !practiceView &&
          (!task.isNewWord || introducedWordKeys[task.wordKey]) &&
          renderRecognition(task)}
        {!loading && !postPracticeTransitioning && session && task && task.mode === 'reinforcement' && !practiceView && renderReinforcement(task)}
        {!loading && postPracticeTransitioning && !practiceView && (
          <div className="section" style={{ display: 'grid', placeItems: 'center', minHeight: 180, borderRadius: 22 }}>
            <div style={{ color: 'var(--tg-subtle)', fontWeight: 600 }}>Загрузка следующего упражнения...</div>
          </div>
        )}
        {!loading && practiceView && (
          <div className="section" style={{ display: 'grid', gap: 12, borderRadius: 22 }}>
            <strong style={{ fontSize: 21, lineHeight: 1.2, fontWeight: 600 }}>
              Посмотри как слово{' '}
              <span style={{ color: '#ffd54a', fontWeight: 700 }}>{practiceView.word}</span>{' '}
              используется на практике
            </strong>
            <div style={{ fontSize: 14, lineHeight: 1.35, color: 'var(--tg-subtle)' }}>
              Нажимай на субтитры, чтобы смотреть перевод незнакомых слов.
            </div>
            {practiceLoading ? (
              <div style={{ color: 'var(--tg-subtle)' }}>Загрузка примеров...</div>
            ) : practiceView.snippets.length ? (
              <SnippetCarousel
                items={practiceView.snippets}
                highlight={practiceView.word}
                showFullVideoButton={false}
                total={practiceView.snippets.length}
                hasMore={false}
                isLoadingMore={false}
                onOpenFullVideo={(snippet) => {
                  window.location.href = `/video?contentId=${encodeURIComponent(snippet.contentId)}&focus=${Date.now()}`;
                }}
              />
            ) : (
              <div style={{ color: 'var(--tg-subtle)' }}>Примеры пока не найдены.</div>
            )}
          </div>
        )}
        {!loading && session && task && task.mode === 'recognition' &&
          renderBottomActionPanel({
            visible: recognitionChecked && !practiceView && (!task.isNewWord || introducedWordKeys[task.wordKey]),
            isCorrect: recognitionResult === 'correct',
            title: recognitionResult === 'correct' ? 'Отлично!' : 'Неправильно',
            subtitle: `${task.word} - ${task.translation}`,
            onNext: () => {
              void proceedAfterRecognition(task);
            },
          })}

        {!loading && session && task && task.mode === 'reinforcement' &&
          renderBottomActionPanel({
            visible:
              (task.reinforcement.type === 'match_pairs' ? isReinforcementCorrect : reinforcementChecked) && !practiceView,
            isCorrect: isReinforcementCorrect,
            title: isReinforcementCorrect ? 'Отлично!' : 'Неправильно',
            subtitle:
              task.reinforcement.sentenceTranslation && task.reinforcement.type !== 'match_pairs'
                ? `Перевод: ${task.reinforcement.sentenceTranslation}`
                : null,
            onNext: () => {
              void proceedAfterReinforcement(task);
            },
          })}

        {!loading && practiceView &&
          renderBottomActionPanel({
            visible: !practiceLoading,
            isCorrect: true,
            title: 'Продолжаем',
            subtitle: null,
            onNext: () => {
              void continueAfterPractice();
            },
          })}

        {!loading && session && !task && (
          <div
            className="section"
            style={{
              display: 'grid',
              gap: 14,
              minHeight: 'calc(100svh - 170px)',
              alignContent: 'start',
              borderRadius: 26,
              padding: 16,
              background:
                'radial-gradient(120% 80% at 50% -5%, rgba(78,197,255,0.22) 0%, rgba(31,42,80,0.96) 58%, rgba(14,19,38,1) 100%)',
              border: '1px solid rgba(78,197,255,0.24)',
              boxShadow: '0 22px 45px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.05 }}>
                Отличная тренировка!
              </div>
              <div style={{ color: 'var(--tg-subtle)', fontSize: 15, lineHeight: 1.35 }}>
                Ты укрепил знания и продвинулся ещё дальше. Продолжаем в том же темпе.
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              <div
                style={{
                  borderRadius: 16,
                  border: '1px solid rgba(78,197,255,0.28)',
                  background: 'rgba(15, 24, 48, 0.72)',
                  padding: '10px 10px 8px',
                  display: 'grid',
                  gap: 4,
                }}
              >
                <div style={{ color: 'var(--tg-subtle)', fontSize: 12, fontWeight: 700 }}>XP</div>
                <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{`+${session.xpEarned}`}</div>
              </div>
              <div
                style={{
                  borderRadius: 16,
                  border: '1px solid rgba(78,197,255,0.28)',
                  background: 'rgba(15, 24, 48, 0.72)',
                  padding: '10px 10px 8px',
                  display: 'grid',
                  gap: 4,
                }}
              >
                <div style={{ color: 'var(--tg-subtle)', fontSize: 12, fontWeight: 700 }}>Слов</div>
                <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{session.wordsCompleted}</div>
              </div>
              <div
                style={{
                  borderRadius: 16,
                  border: '1px solid rgba(78,197,255,0.28)',
                  background: 'rgba(15, 24, 48, 0.72)',
                  padding: '10px 10px 8px',
                  display: 'grid',
                  gap: 4,
                }}
              >
                <div style={{ color: 'var(--tg-subtle)', fontSize: 12, fontWeight: 700 }}>Уровень</div>
                <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{auth.profile?.level ?? 'A1'}</div>
              </div>
            </div>

            <div style={{ color: 'var(--tg-subtle)', fontSize: 14, fontWeight: 600 }}>
              За сегодня: {state?.summary?.totalWordsToday ?? 0} слов и {state?.summary?.totalXpToday ?? 0} XP
            </div>

            <div
              style={{
                borderRadius: 18,
                border: '1px solid rgba(78,197,255,0.2)',
                background: 'rgba(9, 14, 30, 0.72)',
                padding: 12,
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800 }}>Слова, которые ты закрепил</div>
              {completedWords.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {completedWords.map((item) => (
                    <div
                      key={item.wordKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        borderRadius: 14,
                        border: '1px solid var(--tg-border)',
                        background: 'rgba(255,255,255,0.02)',
                        padding: '8px 10px',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.15 }}>{item.word}</div>
                        <div style={{ color: 'var(--tg-subtle)', fontSize: 13, lineHeight: 1.25 }}>
                          {item.translation}
                        </div>
                      </div>
                      {item.cefrLevel ? (
                        <span
                          style={{
                            borderRadius: 999,
                            border: '1px solid rgba(78,197,255,0.42)',
                            color: '#9ddfff',
                            fontSize: 12,
                            fontWeight: 800,
                            padding: '4px 8px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.cefrLevel}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--tg-subtle)', fontSize: 14 }}>
                  Отличная работа. Продолжай тренировки, и здесь появятся закреплённые слова.
                </div>
              )}
            </div>

            <Button onClick={load} disabled={submitting} style={{ minHeight: 52, fontSize: 20, fontWeight: 800 }}>
              К следующей тренировке
            </Button>
          </div>
        )}

      </div>
    </PageShell>
  );
}


