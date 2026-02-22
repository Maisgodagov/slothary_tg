import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, X } from 'lucide-react';

import { useAppSelector } from '../../../../app/hooks';
import { useAppDispatch } from '../../../../app/hooks';
import { selectAuth, setProfile } from '../../../../features/auth/slice';
import { usersApi } from '../../../../features/users/api';
import {
  wordTrainingApi,
} from '../../api';
import type {
  WordTrainingContext,
  WordTrainingMasteryMap,
  RecognitionTask,
  ReinforcementTask,
  WordTrainingOverview,
  WordTrainingState,
} from '../../api/types';
import { TrainingStageStepper } from '../../../../features/word-training/components/TrainingStageStepper';
import { useWordTrainingAudio } from '../../../../features/word-training/useWordTrainingAudio';
import type { PhraseSnippet } from '../../../../features/video-dictionary/api';
import { SnippetCarousel } from '../../../../modules/dictionary/components/SnippetCarousel';
import { Button } from '../../../../shared/ui/Button';
import { PageShell } from '../../../../shared/ui/PageShell';
import BottomActionPanel from '../../components/BottomActionPanel/index';
import NewWordIntroCard from '../../components/NewWordIntroCard/index';
import { RecognitionCard } from '../../components/RecognitionCard';
import {
  CurrentBlockCounter,
  CurrentBlockTitle,
  CurrentBlockTitleRow,
  CurrentBlockWrap,
  HomeLayout,
  LearnButtonLabel,
  LearnButtonSub,
  LevelHeaderCounter,
  LevelHeaderRow,
  LevelHeaderTitle,
  LevelRingInner,
  LevelRingOuter,
  MasteryArea,
  MasteryGridCard,
  ProgressCard,
  ProgressFill,
  ProgressTopRow,
  ProgressTrack,
  SessionHeaderWrap,
  TrainingPageRoot,
} from './styles';

const normalize = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]+/gu, '')
    .replace(/\s+/g, ' ');

const normalizeLoose = (value: string): string => normalize(value.replace(/[.,!?;:]/g, ' '));
const isWordToken = (value: string): boolean => /^[A-Za-z][A-Za-z'-]*$/.test(value);
const CEFR_LEVELS: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'> = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const MASTERY_BG = {
  known: '#2ac46f',
  learning: '#f2c94c',
  new: 'rgba(255,255,255,0.16)',
} as const;
const MASTERY_CELL_ANIMATION_MS = 2400;
const MASTERY_CELL_ANIMATION_GAP_MS = 220;
const normalizeSectionTitleKey = (title: string) =>
  String(title ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .trim()
    .toLowerCase();
const getCefrBlockOrder = (block: string | null | undefined, level: string) => {
  if (!block) return Number.MAX_SAFE_INTEGER;
  const match = String(block).toUpperCase().match(new RegExp(`^${level.toUpperCase()}_(\\d+)$`));
  if (!match) return Number.MAX_SAFE_INTEGER;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
};

export function WordTrainingContainer() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const userId = auth.profile?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<WordTrainingOverview | null>(null);
  const [state, setState] = useState<WordTrainingState | null>(null);
  const [masteryMap, setMasteryMap] = useState<WordTrainingMasteryMap | null>(null);
  const [masteryLoading, setMasteryLoading] = useState(false);
  const [completionStage, setCompletionStage] = useState<'praise' | 'map'>('praise');
  const [animatedFilledCellIds, setAnimatedFilledCellIds] = useState<Record<number, true>>({});
  const [animatingCellId, setAnimatingCellId] = useState<number | null>(null);
  const [debugAnimationCellIds, setDebugAnimationCellIds] = useState<number[] | null>(null);

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
  const [practiceView, setPracticeView] = useState<{
    word: string;
    snippets: PhraseSnippet[];
    nextMode: 'recognition' | 'reinforcement' | 'intro';
    recognitionTask?: RecognitionTask | null;
  } | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [postPracticeTransitioning, setPostPracticeTransitioning] = useState(false);
  const [introducedWordKeys, setIntroducedWordKeys] = useState<Record<string, true>>({});
  const completionTimerRef = useRef<number | null>(null);
  const refreshedStreakSessionRef = useRef<string | null>(null);
  const { playAudioUrl, playFeedbackSound, stopAudio } = useWordTrainingAudio();

  const session = state?.session ?? null;
  const task = state?.task ?? null;
  const taskId = task?.itemId ?? null;
  const completedWords = state?.summary?.completedWords ?? [];
  const userLevel = (auth.profile?.level || 'A1').toUpperCase();
  const currentDisplayLevel = String(overview?.currentLevel || userLevel || 'A1').toUpperCase();
  const levelRingPercent = Math.max(0, Math.min(100, Number(overview?.levelRingProgress?.percent ?? 0)));
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
  const lessonProgressLabel = useMemo(() => {
    if (!session) return '';
    if (task && task.queueTotal > 0) {
      return `Упражнение ${task.queuePosition}/${task.queueTotal} • ${lessonProgressPercent}%`;
    }
    if (session.targetWords > 0) {
      return `Слов: ${session.wordsCompleted}/${session.targetWords} • ${lessonProgressPercent}%`;
    }
    return `${lessonProgressPercent}%`;
  }, [lessonProgressPercent, session, task]);
  const suggestedWordsCount = useMemo(() => {
    const n = Number(overview?.suggestedTargetWords ?? 5);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 5;
  }, [overview?.suggestedTargetWords]);
  const currentStageLabel = useMemo(() => {
    const flow = state?.sessionFlow;
    if (!flow) return null;
    const stage = flow.stages.find((item) => item.key === flow.currentStage);
    return stage?.label ?? null;
  }, [state?.sessionFlow]);
  const stageProgress = useMemo(() => {
    const flow = state?.sessionFlow;
    if (!flow) return [];
    return flow.stages.map((stage) => {
      const total = Math.max(0, Number(stage.total ?? 0));
      const completed = Math.max(0, Number(stage.completed ?? 0));
      const percent = total > 0 ? Math.max(0, Math.min(100, Math.round((completed / total) * 100))) : 0;
      const isCurrent = flow.currentStage === stage.key;
      const isDone = total > 0 ? completed >= total : flow.currentStage === 'result' && stage.key === 'result';
      return {
        ...stage,
        total,
        completed,
        percent,
        isCurrent,
        isDone,
      };
    });
  }, [state?.sessionFlow]);
  const introPendingWord = useMemo(() => {
    const queue = state?.introQueue ?? [];
    return queue.find((item) => !introducedWordKeys[item.wordKey]) ?? null;
  }, [introducedWordKeys, state?.introQueue]);
  const isTrainingHomeVisible = !loading && !session && Boolean(overview);

  const isNewWordIntroVisible = Boolean(session && introPendingWord && !practiceView && !postPracticeTransitioning);

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
    async (word: string, limit = 30): Promise<PhraseSnippet[]> => {
      try {
        const safeLimit = Math.max(1, Math.min(30, limit));
        const response = await wordTrainingApi.getExamples(word, userId, safeLimit, 2, 2, 4);
        return (response.items ?? [])
          .map((item, index) => mapContextToSnippet(item, index, word))
          .filter((item): item is PhraseSnippet => Boolean(item))
          .slice(0, safeLimit);
      } catch {
        return [];
      }
    },
    [mapContextToSnippet, userId],
  );

  const openPracticeBetweenSteps = useCallback(
    async (params: {
      word: string;
      nextMode: 'recognition' | 'reinforcement' | 'intro';
      recognitionTask?: RecognitionTask | null;
      snippetLimit?: number;
    }) => {
      setPracticeView({
        word: params.word,
        snippets: [],
        nextMode: params.nextMode,
        recognitionTask: params.recognitionTask ?? null,
      });
      setPracticeLoading(true);
      const snippets = await loadPracticeSnippets(params.word, params.snippetLimit ?? 30);
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
      if (payload.nextMode === 'intro') {
        return;
      }
      if (payload.nextMode === 'recognition' && payload.recognitionTask) {
        await submitRecognitionResult(payload.recognitionTask);
        return;
      }
      await submitReinforcement();
    } finally {
      setPostPracticeTransitioning(false);
    }
  }, [practiceView]);

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
    setMasteryLoading(true);

    try {
      const streakResult = await usersApi.refreshStreak(userId);
      if (auth.profile) {
        dispatch(setProfile({ ...auth.profile, streakDays: streakResult.streakDays }));
      }
      const [data, mastery] = await Promise.all([
        wordTrainingApi.getOverview(userId),
        wordTrainingApi.getMasteryMap(userId, auth.profile?.role ?? null).catch(() => null),
      ]);
      setOverview(data);
      setMasteryMap(mastery);

      if (data.activeSession?.id) {
        const sessionState = await wordTrainingApi.getSession(data.activeSession.id, userId);
        setState(sessionState);
      } else {
        setState(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setMasteryLoading(false);
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

  useEffect(() => {
    setPracticeView(null);
    setPracticeLoading(false);
    setPostPracticeTransitioning(false);
    setIntroducedWordKeys({});
  }, [session?.id]);

  useEffect(() => {
    if (session?.status !== 'completed') {
      setCompletionStage('praise');
      setAnimatedFilledCellIds({});
      setAnimatingCellId(null);
      setDebugAnimationCellIds(null);
    }
  }, [session?.status]);

  useEffect(() => {
    if (session?.status !== 'completed' || task) return;
    if (completionTimerRef.current) {
      window.clearTimeout(completionTimerRef.current);
    }
    completionTimerRef.current = window.setTimeout(() => {
      setCompletionStage('map');
    }, 1400);
    return () => {
      if (completionTimerRef.current) {
        window.clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
    };
  }, [session?.status, task]);

  useEffect(() => {
    if (!userId || session?.status !== 'completed' || task) return;
    void wordTrainingApi
      .getMasteryMap(userId, auth.profile?.role ?? null)
      .then((data) => setMasteryMap(data))
      .catch(() => undefined);
  }, [auth.profile?.role, session?.status, task, userId]);

  useEffect(() => {
    if (completionStage !== 'map' || session?.status !== 'completed' || !masteryMap) return;
    const completedKeys = new Set((completedWords ?? []).map((word) => normalize(word.word)));
    const toAnimate = (debugAnimationCellIds?.length
      ? masteryMap.items.filter((item) => debugAnimationCellIds.includes(item.id))
      : masteryMap.items.filter((item) => completedKeys.has(normalize(item.word))));
    if (!toAnimate.length) return;
    let idx = 0;
    let stepTimer: number | null = null;
    const runStep = () => {
      const cell = toAnimate[idx];
      if (!cell) {
        setAnimatingCellId(null);
        return;
      }
      setAnimatingCellId(cell.id);
      stepTimer = window.setTimeout(() => {
        setAnimatedFilledCellIds((prev) => ({ ...prev, [cell.id]: true }));
        setAnimatingCellId(null);
        idx += 1;
        stepTimer = window.setTimeout(runStep, MASTERY_CELL_ANIMATION_GAP_MS);
      }, MASTERY_CELL_ANIMATION_MS);
    };
    runStep();
    return () => {
      if (stepTimer) window.clearTimeout(stepTimer);
      setAnimatingCellId(null);
    };
  }, [completionStage, completedWords, debugAnimationCellIds, masteryMap, session?.status]);

  useEffect(() => {
    if (!session || session.status !== 'completed' || !userId || !auth.profile) return;
    if (refreshedStreakSessionRef.current === session.id) return;
    refreshedStreakSessionRef.current = session.id;
    void usersApi
      .refreshStreak(userId)
      .then((result) => {
        if (!auth.profile) return;
        if (auth.profile.streakDays === result.streakDays) return;
        dispatch(setProfile({ ...auth.profile, streakDays: result.streakDays }));
      })
      .catch(() => {
        // ignore non-blocking streak update errors
      });
  }, [auth.profile, dispatch, session, userId]);

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
              phraseExercisesPerWord: 3,
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

  const skipToFinalDebug = async () => {
    if (!userId || !session) return;
    setSubmitting(true);
    setError(null);
    try {
      const [result, map] = await Promise.all([
        wordTrainingApi.finishSession(session.id, { force: true }, userId),
        wordTrainingApi.getMasteryMap(userId, auth.profile?.role ?? null).catch(() => null),
      ]);
      setState(result);
      if (map) {
        setMasteryMap(map);
        const demoIds = map.items
          .filter((item) => item.mastery !== 'known')
          .slice(0, 16)
          .map((item) => item.id);
        setDebugAnimationCellIds(demoIds);
      }
      setCompletionStage('map');
      const freshOverview = await wordTrainingApi.getOverview(userId);
      setOverview(freshOverview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось перейти к финальному экрану');
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
      const success = await submitRecognitionResult(recognition);
      if (!success) return;
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

  const proceedAfterReinforcement = useCallback(async () => {
    await submitReinforcement();
  }, [submitReinforcement]);

  const renderRecognition = (recognition: RecognitionTask) => {
    return (
      <RecognitionCard
        recognition={recognition}
        submitting={submitting}
        recognitionChecked={recognitionChecked}
        recognitionWrongOption={recognitionWrongOption}
        optionButtonBaseStyle={optionButtonBaseStyle}
        onPlayPronunciation={(task) => void playPronunciation(task)}
        normalize={normalize}
        onPickOption={(option, isCorrectOption) => {
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
      />
    );
  };

  const renderNewWordIntro = (introWord: {
    wordKey: string;
    word: string;
    translation: string;
    pronunciationAudioUrl?: string | null;
    cefrLevel?: string | null;
    otherTranslations?: string[];
  }) => {
    return <NewWordIntroCard introWord={introWord} onPlayAudio={(url) => void playAudioUrl(url)} />;
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
                    margin: '0 3px',
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
    const usageLeft = new Map(answerUsage);
    const availableBankTokens: Array<{ token: string; sourceIndex: number }> = [];
    for (let sourceIndex = 0; sourceIndex < assembleTokens.length; sourceIndex += 1) {
      const token = assembleTokens[sourceIndex];
      const key = normalizeLoose(token);
      const usedCount = usageLeft.get(key) ?? 0;
      if (usedCount > 0) {
        usageLeft.set(key, usedCount - 1);
        continue;
      }
      availableBankTokens.push({ token, sourceIndex });
    }

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
          {availableBankTokens.map(({ token, sourceIndex }) => {
            const disabled = reinforcementChecked || assembleAnswer.length >= maxSlots;

            return (
              <button
                key={`${sourceIndex}-${token}`}
                type="button"
                onClick={() => {
                  if (disabled) return;
                  setAssembleAnswer((prev) => [...prev, token]);
                }}
                disabled={disabled}
                style={{
                  ...optionButtonBaseStyle,
                  border: '1px solid var(--tg-border)',
                  background: 'var(--tg-card)',
                  color: 'var(--tg-text)',
                  opacity: disabled ? 0.75 : 1,
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
    buttonLabel?: string;
    hideMessageBox?: boolean;
  }) => {
    return (
      <BottomActionPanel
        visible={params.visible}
        isCorrect={params.isCorrect}
        title={params.title}
        subtitle={params.subtitle}
        onNext={params.onNext}
        buttonLabel={params.buttonLabel}
        hideMessageBox={params.hideMessageBox}
        submitting={submitting}
      />
    );
  };

  const renderReinforcement = (reinforcement: ReinforcementTask) => (
    <div className="section" style={{ display: 'grid', gap: 12, borderRadius: 22 }}>
      {(() => {
        const isMatchPairs = reinforcement.reinforcement.type === 'match_pairs';
        const isMissing = reinforcement.reinforcement.type === 'missing';
        return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <strong
          style={
            isMatchPairs
              ? { fontSize: 25, lineHeight: 1.15, fontWeight: 600, marginBottom: 24, display: 'inline-block' }
              : isMissing
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
        {isMissing && (
          <button
            type="button"
            onClick={() => void playAudioUrl(reinforcement.reinforcement.phraseAudioUrl ?? null)}
            disabled={!reinforcement.reinforcement.phraseAudioUrl}
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
              opacity: reinforcement.reinforcement.phraseAudioUrl ? 1 : 0.45,
              flexShrink: 0,
            }}
          >
            <Volume2 size={18} />
          </button>
        )}
      </div>
        );
      })()}

      {reinforcement.reinforcement.type === 'audio_assemble' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={() =>
              void playAudioUrl(
                reinforcement.pronunciationAudioUrl ?? null,
              )
            }
            disabled={!reinforcement.pronunciationAudioUrl}
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

      {reinforcement.reinforcement.type !== 'match_pairs' && !reinforcementChecked ? (
        <Button
          onClick={submitReinforcement}
          disabled={submitting || (!reinforcementChecked && !canCheckReinforcement)}
          style={{
            minHeight: 50,
            fontSize: 20,
            fontWeight: 700,
            borderRadius: 14,
            background: 'var(--tg-accent)',
            boxShadow: 'none',
          }}
        >
          {reinforcementChecked ? 'Далее' : 'Проверить'}
        </Button>
      ) : null}
    </div>
  );

  const renderMasteryGrid = (animated = false, fillHeight = false) => {
    if (!masteryMap) return null;
    const grouped: Record<string, typeof masteryMap.items> = {};
    for (const level of CEFR_LEVELS) grouped[level] = [];
    for (const item of masteryMap.items) {
      const level = (item.cefrLevel ?? '').toUpperCase();
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(item);
    }

    return (
      <MasteryGridCard $fillHeight={fillHeight}>
        {CEFR_LEVELS.map((level) => {
          const levelItems = grouped[level] ?? [];
          const levelStats = masteryMap.byLevel[level];
          if (!levelItems.length || !levelStats) return null;

          const sectionsMap = new Map<string, { title: string; order: number; items: typeof levelItems }>();
          for (const item of levelItems) {
            const sectionKey = item.cefrBlock || `${level}_1`;
            const title = masteryMap.blockTitles?.[sectionKey] ?? sectionKey;
            const normalizedTitleKey = normalizeSectionTitleKey(title);
            const order = getCefrBlockOrder(sectionKey, level);
            if (!sectionsMap.has(normalizedTitleKey)) {
              sectionsMap.set(normalizedTitleKey, { title: title.trim(), order, items: [] });
            }
            const section = sectionsMap.get(normalizedTitleKey)!;
            section.order = Math.min(section.order, order);
            section.items.push(item);
          }
          const sections = Array.from(sectionsMap.values()).sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
          });

          return (
            <div key={level} style={{ display: 'grid', gap: 8 }}>
              <LevelHeaderRow>
                <LevelHeaderTitle>Уровень {level}</LevelHeaderTitle>
                <LevelHeaderCounter>
                  {levelStats.known}/{levelStats.total}
                </LevelHeaderCounter>
              </LevelHeaderRow>
              {sections.map((section, sectionIndex) => (
                <div
                  key={`${level}-${section.title}`}
                  style={{
                    display: 'grid',
                    gap: 6,
                    paddingTop: sectionIndex === 0 ? 0 : 8,
                    marginTop: sectionIndex === 0 ? 0 : 2,
                    borderTop: sectionIndex === 0 ? 'none' : '1px dashed rgba(255,255,255,0.14)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--tg-subtle)',
                      lineHeight: 1.2,
                    }}
                  >
                    {section.title}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(23, minmax(0, 1fr))', gap: 4 }}>
                    {section.items.map((item) => {
                      const filledAnimated = animated && Boolean(animatedFilledCellIds[item.id]);
                      const bg = filledAnimated ? MASTERY_BG.known : MASTERY_BG[item.mastery];
                      return (
                        <div
                          key={item.id}
                          title={`${item.word} (${item.cefrLevel})`}
                          style={{
                            width: '100%',
                            aspectRatio: '1 / 1',
                            borderRadius: 4,
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: bg,
                            transition: 'background-color 220ms ease',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </MasteryGridCard>
    );
  };

  if (!userId) {
    return (
      <PageShell>
        <div style={{ padding: 16 }}>Нужна авторизация.</div>
      </PageShell>
    );
  }

  return (
    <PageShell scroll={!isTrainingHomeVisible}>
      <TrainingPageRoot $homeVisible={isTrainingHomeVisible}>
        {session?.status === 'active' && (
          <SessionHeaderWrap>
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
                  height: 9,
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
                    background: 'var(--tg-success)',
                    transition: 'width 220ms ease',
                  }}
                />
              </div>
            </div>
            <div style={{ color: 'var(--tg-subtle)', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>
              {lessonProgressLabel}
            </div>
            {currentStageLabel ? (
              <div style={{ color: 'var(--tg-subtle)', fontSize: 12, fontWeight: 600, lineHeight: 1 }}>
                Этап: {currentStageLabel}
              </div>
            ) : null}
            <TrainingStageStepper stages={stageProgress} />
            {auth.profile?.role === 'admin' && (
              <button
                type="button"
                onClick={() => void skipToFinalDebug()}
                disabled={submitting}
                style={{
                  width: 'fit-content',
                  borderRadius: 10,
                  border: '1px dashed var(--tg-border)',
                  background: 'transparent',
                  color: 'var(--tg-subtle)',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '5px 9px',
                }}
              >
                Скип к финалу (debug)
              </button>
            )}
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
          </SessionHeaderWrap>
        )}

        {error && <div className="section" style={{ color: 'var(--tg-danger)' }}>{error}</div>}
        {loading && <div className="section">Загрузка...</div>}

        {isNewWordIntroVisible && introPendingWord ? renderNewWordIntro(introPendingWord) : null}

        {!loading && !session && overview && (
          <HomeLayout>
            <ProgressCard>
              <ProgressTopRow>
                <CurrentBlockWrap>
                  <CurrentBlockTitleRow>
                    <CurrentBlockTitle>{(overview.currentBlockTitle || 'Текущий блок').trim()}</CurrentBlockTitle>
                    <CurrentBlockCounter>
                      {overview.currentBlockProgress
                        ? `${overview.currentBlockProgress.knownWords}/${overview.currentBlockProgress.totalWords}`
                        : ''}
                    </CurrentBlockCounter>
                  </CurrentBlockTitleRow>
                  <ProgressTrack>
                    <ProgressFill
                      $width={Math.max(0, Math.min(100, Number(overview.currentBlockProgress?.percent ?? 0)))}
                    />
                  </ProgressTrack>
                </CurrentBlockWrap>
                <LevelRingOuter title={`Уровень ${currentDisplayLevel}: ${levelRingPercent}%`}>
                  <LevelRingInner>{currentDisplayLevel}</LevelRingInner>
                </LevelRingOuter>
              </ProgressTopRow>
              <Button
                onClick={startOrResume}
                disabled={submitting || masteryLoading}
                style={{
                  minHeight: 52,
                  fontSize: 20,
                  fontWeight: 700,
                  borderRadius: 14,
                  boxShadow: 'none',
                  marginTop: 4,
                  background: 'var(--tg-accent-strong)',
                  backgroundImage: 'none',
                  color: '#0b0b0b',
                }}
              >
                <LearnButtonLabel>
                  <span>Учить слова</span>
                  <LearnButtonSub>+ {suggestedWordsCount} новых слов</LearnButtonSub>
                </LearnButtonLabel>
              </Button>
            </ProgressCard>

            <MasteryArea>
              {renderMasteryGrid(false, true)}
            </MasteryArea>
          </HomeLayout>
        )}

        {!loading &&
          !postPracticeTransitioning &&
          session &&
          task &&
          task.mode === 'recognition' &&
          !practiceView &&
          !isNewWordIntroVisible &&
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
              Послушай слово{' '}
              <span style={{ color: '#ffd54a', fontWeight: 700 }}>{practiceView.word}</span>{' '}
              в живой речи
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
        {!loading && introPendingWord &&
          renderBottomActionPanel({
            visible: isNewWordIntroVisible,
            isCorrect: true,
            title: 'Новое слово',
            subtitle: `${introPendingWord.word} - ${introPendingWord.translation}`,
            buttonLabel: 'Понятно',
            onNext: () => {
              setIntroducedWordKeys((prev) => ({ ...prev, [introPendingWord.wordKey]: true }));
              void openPracticeBetweenSteps({
                word: introPendingWord.word,
                nextMode: 'intro',
                snippetLimit: 4,
              });
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
              void proceedAfterReinforcement();
            },
          })}

        {!loading && practiceView &&
          renderBottomActionPanel({
            visible: !practiceLoading,
            isCorrect: true,
            title: 'Продолжаем',
            subtitle: null,
            hideMessageBox: true,
            onNext: () => {
              void continueAfterPractice();
            },
          })}

        {animatingCellId && typeof document !== 'undefined'
          ? createPortal(
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 90,
                  pointerEvents: 'none',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <div className="mastery-cell-modal-overlay" />
                <div className="mastery-cell-modal" />
              </div>,
              document.body,
            )
          : null}

        {!loading && session && !task && completionStage === 'praise' && (
          <div
            className="section"
            style={{
              display: 'grid',
              gap: 14,
              minHeight: 'calc(100svh - 170px)',
              alignContent: 'start',
              borderRadius: 24,
              padding: 16,
              background: 'var(--tg-card)',
              border: '1px solid var(--tg-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>??</span>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.05 }}>Отличная тренировка!</div>
            </div>
            <div style={{ color: 'var(--tg-subtle)', fontSize: 15, lineHeight: 1.35 }}>
              Ты закрыл {session.wordsCompleted} слов и получил +{session.xpEarned} XP.
            </div>
            <div style={{ color: 'var(--tg-subtle)', fontSize: 14, fontWeight: 700 }}>
              За сегодня: {state?.summary?.totalWordsToday ?? 0} слов · {state?.summary?.totalXpToday ?? 0} XP
            </div>
          </div>
        )}

        {!loading && session && !task && completionStage === 'map' && (
          <>
            {renderMasteryGrid(true)}
            <Button
              onClick={load}
              disabled={submitting}
              style={{
                minHeight: 52,
                fontSize: 20,
                fontWeight: 800,
                boxShadow: 'none',
                background: 'var(--tg-accent-strong)',
                backgroundImage: 'none',
                color: '#0b0b0b',
              }}
            >
              Учить слова
            </Button>
          </>
        )}

      </TrainingPageRoot>
    </PageShell>
  );
}







