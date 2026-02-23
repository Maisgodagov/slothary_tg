import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useAppSelector } from "../../../../app/hooks";
import { useAppDispatch } from "../../../../app/hooks";
import { selectAuth, setProfile } from "../../../../features/auth/slice";
import { usersApi } from "../../../../features/users/api";
import { muellerApi } from "../../../../features/mueller/api";
import { wordTrainingApi } from "../../api";
import type {
  WordTrainingContext,
  WordTrainingMasteryMap,
  RecognitionTask,
  ReinforcementTask,
  WordTrainingOverview,
  WordTrainingState,
} from "../../api/types";
import { useWordTrainingAudio } from "../../../../features/word-training/useWordTrainingAudio";
import type { PhraseSnippet } from "../../../../features/video-dictionary/api";
import { PageShell } from "../../../../shared/ui/PageShell";
import BottomActionPanel from "../../components/BottomActionPanel/index";
import NewWordIntroCard from "../../components/NewWordIntroCard/entry";
import PracticeSnippetCard from "../../components/PracticeSnippetCard";
import { RecognitionCard } from "../../components/RecognitionCard";
import ReinforcementCard from "../../components/ReinforcementCard";
import TrainingCompletionView from "../../components/TrainingCompletionView";
import TrainingSessionHeader from "../../components/TrainingSessionHeader";
import TrainingHome from "../../components/TrainingHome";
import { TrainingPageRoot } from "./styles";

const normalize = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]+/gu, "")
    .replace(/\s+/g, " ");

const normalizeLoose = (value: string): string =>
  normalize(value.replace(/[.,!?;:]/g, " "));
const isWordToken = (value: string): boolean =>
  /^[A-Za-z][A-Za-z'-]*$/.test(value);
const MASTERY_CELL_ANIMATION_MS = 2400;
const MASTERY_CELL_ANIMATION_GAP_MS = 220;

export function WordTrainingContainer() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const userId = auth.profile?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<WordTrainingOverview | null>(null);
  const [state, setState] = useState<WordTrainingState | null>(null);
  const [masteryMap, setMasteryMap] = useState<WordTrainingMasteryMap | null>(
    null,
  );
  const [masteryLoading, setMasteryLoading] = useState(false);
  const [completionStage, setCompletionStage] = useState<"praise" | "map">(
    "praise",
  );
  const [animatedFilledCellIds, setAnimatedFilledCellIds] = useState<
    Record<number, true>
  >({});
  const [animatingCellId, setAnimatingCellId] = useState<number | null>(null);
  const [debugAnimationCellIds, setDebugAnimationCellIds] = useState<
    number[] | null
  >(null);

  const [assembleAnswer, setAssembleAnswer] = useState<string[]>([]);
  const [recognitionSelected, setRecognitionSelected] = useState<string | null>(
    null,
  );
  const [recognitionChecked, setRecognitionChecked] = useState(false);
  const [recognitionWrongOption, setRecognitionWrongOption] = useState<
    string | null
  >(null);
  const [recognitionResult, setRecognitionResult] = useState<
    "correct" | "wrong" | null
  >(null);
  const [missingSelected, setMissingSelected] = useState<
    [string | null, string | null]
  >([null, null]);
  const [pairMatches, setPairMatches] = useState<Record<string, string>>({});
  const [pairLeftSelected, setPairLeftSelected] = useState<string | null>(null);
  const [pairRightSelected, setPairRightSelected] = useState<string | null>(
    null,
  );
  const [pairWrongWord, setPairWrongWord] = useState<string | null>(null);
  const [pairWrongTranslation, setPairWrongTranslation] = useState<
    string | null
  >(null);
  const [reinforcementChecked, setReinforcementChecked] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [practiceView, setPracticeView] = useState<{
    word: string;
    snippets: PhraseSnippet[];
    nextMode: "recognition" | "reinforcement" | "intro";
    recognitionTask?: RecognitionTask | null;
  } | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [postPracticeTransitioning, setPostPracticeTransitioning] =
    useState(false);
  const [introSnippets, setIntroSnippets] = useState<PhraseSnippet[]>([]);
  const [introSnippetsLoading, setIntroSnippetsLoading] = useState(false);
  const [introducedWordKeys, setIntroducedWordKeys] = useState<
    Record<string, true>
  >({});
  const [enteredSessionId, setEnteredSessionId] = useState<string | null>(null);
  const completionTimerRef = useRef<number | null>(null);
  const refreshedStreakSessionRef = useRef<string | null>(null);
  const wordPronunciationCacheRef = useRef<Map<string, string | null>>(
    new Map(),
  );
  const introPronouncedWordKeyRef = useRef<string | null>(null);
  const { playAudioUrl, playFeedbackSound, stopAudio } = useWordTrainingAudio();

  const session = state?.session ?? null;
  const task = state?.task ?? null;
  const taskId = task?.itemId ?? null;
  const isActiveSession = session?.status === "active";
  const isSessionEntered = Boolean(
    isActiveSession && session?.id && enteredSessionId === session.id,
  );
  const isPausedActiveSession = Boolean(isActiveSession && !isSessionEntered);
  const completedWords = state?.summary?.completedWords ?? [];
  const userLevel = (auth.profile?.level || "A1").toUpperCase();
  const currentDisplayLevel = String(
    overview?.currentLevel || userLevel || "A1",
  ).toUpperCase();
  const levelRingPercent = Math.max(
    0,
    Math.min(100, Number(overview?.levelRingProgress?.percent ?? 0)),
  );
  const lessonProgressPercent = useMemo(() => {
    if (!session) return 0;
    if (task && task.queueTotal > 0) {
      return Math.max(
        0,
        Math.min(100, Math.round((task.queuePosition / task.queueTotal) * 100)),
      );
    }
    if (session.targetWords > 0) {
      return Math.max(
        0,
        Math.min(
          100,
          Math.round((session.wordsCompleted / session.targetWords) * 100),
        ),
      );
    }
    return 0;
  }, [session, task]);
  const suggestedWordsCount = useMemo(() => {
    const n = Number(overview?.suggestedTargetWords ?? 5);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 5;
  }, [overview?.suggestedTargetWords]);
  const introPendingWord = useMemo(() => {
    const queue = state?.introQueue ?? [];
    return queue.find((item) => !introducedWordKeys[item.wordKey]) ?? null;
  }, [introducedWordKeys, state?.introQueue]);
  const isTrainingHomeVisible =
    !loading && Boolean(overview) && (!session || isPausedActiveSession);

  const isNewWordIntroVisible = Boolean(
    session && introPendingWord && !practiceView && !postPracticeTransitioning,
  );

  const missingExerciseModel = useMemo(() => {
    if (
      !task ||
      task.mode !== "reinforcement" ||
      task.reinforcement.type !== "missing"
    )
      return null;

    const sentence = task.reinforcement.sentence ?? "";
    const rawTokens = sentence.match(/[A-Za-z][A-Za-z'-]*|[^A-Za-z]+/g) ?? [
      sentence,
    ];
    const wordIndexes = rawTokens
      .map((token, index) => (isWordToken(token) ? index : -1))
      .filter((index) => index >= 0);

    const correctWordNorm = normalize(task.reinforcement.correctWord ?? "");
    let firstIndex =
      wordIndexes.find(
        (index) => normalize(rawTokens[index] ?? "") === correctWordNorm,
      ) ?? -1;
    if (firstIndex < 0) firstIndex = wordIndexes[0] ?? 0;

    const secondIndex =
      wordIndexes.find(
        (index) =>
          index !== firstIndex &&
          normalize(rawTokens[index] ?? "") !== correctWordNorm &&
          (rawTokens[index]?.length ?? 0) > 2,
      ) ??
      wordIndexes.find((index) => index !== firstIndex) ??
      firstIndex;

    const blankIndexes = [firstIndex, secondIndex].sort((a, b) => a - b);
    const expectedWords: [string, string] = [
      rawTokens[blankIndexes[0]] ?? "",
      rawTokens[blankIndexes[1]] ?? "",
    ];

    const distractors = (task.reinforcement.options ?? [])
      .filter(
        (option) =>
          !expectedWords.some((word) => normalize(word) === normalize(option)),
      )
      .slice(0, 4);
    const options = [...expectedWords, ...distractors]
      .filter(
        (option, index, arr) =>
          arr.findIndex((item) => normalize(item) === normalize(option)) ===
          index,
      )
      .sort(() => Math.random() - 0.5);

    return { rawTokens, blankIndexes, expectedWords, options };
  }, [task]);

  const mapContextToSnippet = useCallback(
    (
      item: WordTrainingContext,
      index: number,
      word: string,
    ): PhraseSnippet | null => {
      if (!item.videoUrl?.trim()) return null;
      const start = Number.isFinite(item.startSeconds as number)
        ? Number(item.startSeconds)
        : 0;
      const endRaw = Number.isFinite(item.endSeconds as number)
        ? Number(item.endSeconds)
        : start + 6;
      const end = endRaw > start ? endRaw : start + 6;
      const contextText = item.text?.trim() || word;
      return {
        id: `${item.contentId}-${start}-${end}-${index}`,
        contentId: String(item.contentId),
        videoName: item.videoName || "Видео",
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
        const response = await wordTrainingApi.getExamples(
          word,
          userId,
          safeLimit,
          2,
          2,
          4,
        );
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

  const continueAfterPractice = useCallback(async () => {
    if (!practiceView) return;
    const payload = practiceView;
    setPostPracticeTransitioning(true);
    setPracticeView(null);
    try {
      if (payload.nextMode === "intro") {
        return;
      }
      if (payload.nextMode === "recognition" && payload.recognitionTask) {
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
        dispatch(
          setProfile({ ...auth.profile, streakDays: streakResult.streakDays }),
        );
      }
      const [data, mastery] = await Promise.all([
        wordTrainingApi.getOverview(userId),
        wordTrainingApi
          .getMasteryMap(userId, auth.profile?.role ?? null)
          .catch(() => null),
      ]);
      setOverview(data);
      setMasteryMap(mastery);

      if (data.activeSession?.id) {
        const sessionState = await wordTrainingApi.getSession(
          data.activeSession.id,
          userId,
        );
        setState(sessionState);
        setEnteredSessionId(null);
      } else {
        setState(null);
        setEnteredSessionId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
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
    const shouldAutoplay = isSessionEntered && task?.mode === "recognition";
    if (shouldAutoplay) {
      void playPronunciation(task);
    }
  }, [isSessionEntered, taskId, playPronunciation, stopAudio, task]);

  useEffect(() => {
    setPracticeView(null);
    setPracticeLoading(false);
    setPostPracticeTransitioning(false);
    setIntroSnippets([]);
    setIntroSnippetsLoading(false);
    setIntroducedWordKeys({});
  }, [session?.id]);

  useEffect(() => {
    const word = introPendingWord?.word?.trim();
    if (!isSessionEntered || !isNewWordIntroVisible || !word) {
      setIntroSnippets([]);
      setIntroSnippetsLoading(false);
      return;
    }
    let cancelled = false;
    setIntroSnippetsLoading(true);
    void loadPracticeSnippets(word, 30)
      .then((items) => {
        if (cancelled) return;
        setIntroSnippets(items.slice(0, 30));
      })
      .finally(() => {
        if (cancelled) return;
        setIntroSnippetsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    introPendingWord?.word,
    isNewWordIntroVisible,
    isSessionEntered,
    loadPracticeSnippets,
  ]);

  useEffect(() => {
    if (!isSessionEntered || !isNewWordIntroVisible || !introPendingWord) return;
    if (!introPendingWord.pronunciationAudioUrl?.trim()) return;
    if (introPronouncedWordKeyRef.current === introPendingWord.wordKey) return;
    introPronouncedWordKeyRef.current = introPendingWord.wordKey;
    void playAudioUrl(introPendingWord.pronunciationAudioUrl);
  }, [
    introPendingWord,
    isNewWordIntroVisible,
    isSessionEntered,
    playAudioUrl,
  ]);

  useEffect(() => {
    if (!isNewWordIntroVisible) {
      introPronouncedWordKeyRef.current = null;
    }
  }, [isNewWordIntroVisible]);

  useEffect(() => {
    if (session?.status !== "active") {
      setEnteredSessionId(null);
    }
  }, [session?.status]);

  useEffect(() => {
    if (session?.status !== "completed") {
      setCompletionStage("praise");
      setAnimatedFilledCellIds({});
      setAnimatingCellId(null);
      setDebugAnimationCellIds(null);
    }
  }, [session?.status]);

  useEffect(() => {
    if (session?.status !== "completed" || task) return;
    if (completionTimerRef.current) {
      window.clearTimeout(completionTimerRef.current);
    }
    completionTimerRef.current = window.setTimeout(() => {
      setCompletionStage("map");
    }, 1400);
    return () => {
      if (completionTimerRef.current) {
        window.clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
    };
  }, [session?.status, task]);

  useEffect(() => {
    if (!userId || session?.status !== "completed" || task) return;
    void wordTrainingApi
      .getMasteryMap(userId, auth.profile?.role ?? null)
      .then((data) => setMasteryMap(data))
      .catch(() => undefined);
  }, [auth.profile?.role, session?.status, task, userId]);

  useEffect(() => {
    if (
      completionStage !== "map" ||
      session?.status !== "completed" ||
      !masteryMap
    )
      return;
    const completedKeys = new Set(
      (completedWords ?? []).map((word) => normalize(word.word)),
    );
    const toAnimate = debugAnimationCellIds?.length
      ? masteryMap.items.filter((item) =>
          debugAnimationCellIds.includes(item.id),
        )
      : masteryMap.items.filter((item) =>
          completedKeys.has(normalize(item.word)),
        );
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
  }, [
    completionStage,
    completedWords,
    debugAnimationCellIds,
    masteryMap,
    session?.status,
  ]);

  useEffect(() => {
    if (!session || session.status !== "completed" || !userId || !auth.profile)
      return;
    if (refreshedStreakSessionRef.current === session.id) return;
    refreshedStreakSessionRef.current = session.id;
    void usersApi
      .refreshStreak(userId)
      .then((result) => {
        if (!auth.profile) return;
        if (auth.profile.streakDays === result.streakDays) return;
        dispatch(
          setProfile({ ...auth.profile, streakDays: result.streakDays }),
        );
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
        userLevelRaw === "A1" ||
        userLevelRaw === "A2" ||
        userLevelRaw === "B1" ||
        userLevelRaw === "B2" ||
        userLevelRaw === "C1" ||
        userLevelRaw === "C2"
          ? userLevelRaw
          : "A1";
      const targetWords = Math.min(
        5,
        Math.max(1, overview?.suggestedTargetWords ?? 5),
      );
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
      setEnteredSessionId(result.session.id);
      const freshOverview = await wordTrainingApi.getOverview(userId);
      setOverview(freshOverview);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось начать тренировку",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const finishEarly = () => {
    stopAudio();
    setPracticeView(null);
    setPracticeLoading(false);
    setPostPracticeTransitioning(false);
    setEnteredSessionId(null);
  };

  const submitRecognitionResult = async (
    recognition: RecognitionTask,
  ): Promise<boolean> => {
    if (!userId || !session) return false;
    if (!recognitionSelected) return false;

    const isCorrect =
      normalize(recognitionSelected) === normalize(recognition.translation);
    const grade = isCorrect ? "good" : "again";

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
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить ответ",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const markKnownWord = useCallback(
    async (wordKey: string) => {
      if (!userId || !session?.id) return;
      setSubmitting(true);
      setError(null);
      stopAudio();
      try {
        const next = await wordTrainingApi.markWordKnown(
          session.id,
          { wordKey },
          userId,
        );
        setState(next);
        const [freshOverview, freshMastery] = await Promise.all([
          wordTrainingApi.getOverview(userId),
          wordTrainingApi
            .getMasteryMap(userId, auth.profile?.role ?? null)
            .catch(() => null),
        ]);
        setOverview(freshOverview);
        if (freshMastery) setMasteryMap(freshMastery);
        setIntroducedWordKeys((prev) => ({ ...prev, [wordKey]: true }));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Не удалось отметить слово как выученное",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [auth.profile?.role, session?.id, stopAudio, userId],
  );

  const proceedAfterRecognition = useCallback(
    async (recognition: RecognitionTask) => {
      const success = await submitRecognitionResult(recognition);
      if (!success) return;
    },
    [submitRecognitionResult],
  );

  const getTokenUsage = useCallback((tokens: string[]) => {
    const counts = new Map<string, number>();
    for (const token of tokens) {
      const key = normalizeLoose(token);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, []);

  const isReinforcementCorrect = useMemo(() => {
    if (!task || task.mode !== "reinforcement") return false;
    const type = task.reinforcement.type;

    if (type === "missing") {
      if (!missingExerciseModel) return false;
      return (
        normalize(missingSelected[0] ?? "") ===
          normalize(missingExerciseModel.expectedWords[0] ?? "") &&
        normalize(missingSelected[1] ?? "") ===
          normalize(missingExerciseModel.expectedWords[1] ?? "")
      );
    }

    if (type === "audio_assemble") {
      const target = task.reinforcement.targetTokens ?? [];
      if (!target.length || assembleAnswer.length !== target.length)
        return false;
      for (let i = 0; i < target.length; i += 1) {
        if (
          normalizeLoose(assembleAnswer[i] ?? "") !==
          normalizeLoose(target[i] ?? "")
        )
          return false;
      }
      return true;
    }

    const pairs = task.reinforcement.pairs ?? [];
    if (!pairs.length) return false;
    return pairs.every(
      (pair) =>
        normalize(pairMatches[pair.word] ?? "") === normalize(pair.translation),
    );
  }, [
    assembleAnswer,
    missingExerciseModel,
    missingSelected,
    pairMatches,
    task,
  ]);

  const canCheckReinforcement = useMemo(() => {
    if (!task || task.mode !== "reinforcement") return false;
    const type = task.reinforcement.type;

    if (type === "missing")
      return Boolean(missingSelected[0] && missingSelected[1]);
    if (type === "audio_assemble") {
      const targetLength = (task.reinforcement.targetTokens ?? []).length;
      return targetLength > 0 && assembleAnswer.length === targetLength;
    }

    const pairs = task.reinforcement.pairs ?? [];
    if (!pairs.length) return false;
    return pairs.every((pair) => Boolean(pairMatches[pair.word]));
  }, [assembleAnswer, missingSelected, pairMatches, task]);

  const submitReinforcement = async () => {
    if (!userId || !session || !task || task.mode !== "reinforcement") return;
    if (task.reinforcement.type === "match_pairs") {
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
        setError(
          err instanceof Error
            ? err.message
            : "Не удалось сохранить упражнение",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!reinforcementChecked) {
      void playFeedbackSound(isReinforcementCorrect);
      if (task.reinforcement.type === "missing") {
        void playAudioUrl(
          task.reinforcement.phraseAudioUrl ??
            task.pronunciationAudioUrl ??
            null,
        );
      }
      if (
        task.reinforcement.type === "audio_assemble" &&
        isReinforcementCorrect
      ) {
        void playAudioUrl(
          task.reinforcement.phraseAudioUrl ??
            task.pronunciationAudioUrl ??
            null,
        );
      }
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
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить упражнение",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const proceedAfterReinforcement = useCallback(async () => {
    await submitReinforcement();
  }, [submitReinforcement]);

  const resolveWordPronunciationUrl = useCallback(async (word: string) => {
    const value = String(word ?? "").trim();
    if (!value) return null;
    const key = normalizeLoose(value);
    const cached = wordPronunciationCacheRef.current.get(key);
    if (cached !== undefined) return cached;
    if (!isWordToken(value)) {
      wordPronunciationCacheRef.current.set(key, null);
      return null;
    }

    try {
      const entries = await muellerApi.lookup({ word: value, lang: "en" });
      const exact =
        entries.find(
          (entry) =>
            normalizeLoose(String(entry.word ?? "")) ===
              normalizeLoose(value) && Boolean(entry.audioUrl?.trim()),
        ) ?? null;
      const fallback = entries.find((entry) => Boolean(entry.audioUrl?.trim()));
      const url = exact?.audioUrl?.trim() || fallback?.audioUrl?.trim() || null;
      wordPronunciationCacheRef.current.set(key, url);
      return url;
    } catch {
      wordPronunciationCacheRef.current.set(key, null);
      return null;
    }
  }, []);

  const speakAssembleWord = useCallback(async (word: string) => {
    const value = String(word ?? "").trim();
    if (!value || typeof window === "undefined") return;
    const url = await resolveWordPronunciationUrl(value);
    if (url) {
      await playAudioUrl(url);
      return;
    }

    const synth = window.speechSynthesis;
    if (!synth) return;
    try {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(value);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      utterance.pitch = 1;
      synth.speak(utterance);
    } catch {
      // no-op
    }
  }, [playAudioUrl, resolveWordPronunciationUrl]);

  const renderRecognition = (recognition: RecognitionTask) => {
    return (
      <RecognitionCard
        recognition={recognition}
        submitting={submitting}
        recognitionChecked={recognitionChecked}
        recognitionWrongOption={recognitionWrongOption}
        onPlayPronunciation={(task) => void playPronunciation(task)}
        normalize={normalize}
        onPickOption={(option, isCorrectOption) => {
          if (recognitionChecked) return;
          if (isCorrectOption) {
            void playFeedbackSound(true);
            setRecognitionSelected(option);
            setRecognitionChecked(true);
            setRecognitionWrongOption(null);
            setRecognitionResult("correct");
            return;
          }
          void playFeedbackSound(false);
          setRecognitionSelected(option);
          setRecognitionChecked(true);
          setRecognitionWrongOption(option);
          setRecognitionResult("wrong");
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
    return (
      <NewWordIntroCard
        introWord={introWord}
        snippets={introSnippets}
        snippetsLoading={introSnippetsLoading}
        onPlayAudio={(url) => void playAudioUrl(url)}
        onMarkKnown={(wordKey) => {
          void markKnownWord(wordKey);
        }}
        disabled={submitting}
      />
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
    <ReinforcementCard
      reinforcement={reinforcement}
      submitting={submitting}
      reinforcementChecked={reinforcementChecked}
      canCheckReinforcement={canCheckReinforcement}
      missingExerciseModel={missingExerciseModel}
      missingSelected={missingSelected}
      setMissingSelected={setMissingSelected}
      assembleAnswer={assembleAnswer}
      setAssembleAnswer={setAssembleAnswer}
      pairMatches={pairMatches}
      setPairMatches={setPairMatches}
      pairLeftSelected={pairLeftSelected}
      setPairLeftSelected={setPairLeftSelected}
      pairRightSelected={pairRightSelected}
      setPairRightSelected={setPairRightSelected}
      pairWrongWord={pairWrongWord}
      setPairWrongWord={setPairWrongWord}
      pairWrongTranslation={pairWrongTranslation}
      setPairWrongTranslation={setPairWrongTranslation}
      normalize={normalize}
      normalizeLoose={normalizeLoose}
      getTokenUsage={getTokenUsage}
      onPlayAudioUrl={playAudioUrl}
      onSpeakWord={speakAssembleWord}
      onPlayFeedbackSound={playFeedbackSound}
      onSubmitReinforcement={() => {
        void submitReinforcement();
      }}
    />
  );

  if (!userId) {
    return (
      <PageShell>
        <div style={{ padding: 16 }}>Нужна авторизация.</div>
      </PageShell>
    );
  }

  return (
    <PageShell pullToRefresh={false}>
      <TrainingPageRoot $homeVisible={isTrainingHomeVisible}>
        {session?.status === "active" && isSessionEntered && (
          <TrainingSessionHeader
            submitting={submitting}
            lessonProgressPercent={lessonProgressPercent}
            onFinishEarly={() => {
              void finishEarly();
            }}
          />
        )}

        {error && (
          <div className="section" style={{ color: "var(--tg-danger)" }}>
            {error}
          </div>
        )}
        {loading && <div className="section">Загрузка...</div>}

        {isSessionEntered && isNewWordIntroVisible && introPendingWord
          ? renderNewWordIntro(introPendingWord)
          : null}

        {!loading && !session && overview && (
          <TrainingHome
            overview={overview}
            currentDisplayLevel={currentDisplayLevel}
            levelRingPercent={levelRingPercent}
            focusLevel={overview.currentLevel}
            focusBlock={overview.currentBlock}
            submitting={submitting}
            masteryLoading={masteryLoading}
            suggestedWordsCount={suggestedWordsCount}
            masteryMap={masteryMap}
            actionTitle="Учить слова"
            actionSubtitle={`+ ${suggestedWordsCount} новых слов`}
            onStartOrResume={() => {
              void startOrResume();
            }}
          />
        )}

        {!loading &&
          session?.status === "active" &&
          !isSessionEntered &&
          overview && (
            <TrainingHome
              overview={overview}
              currentDisplayLevel={currentDisplayLevel}
              levelRingPercent={levelRingPercent}
              focusLevel={overview.currentLevel}
              focusBlock={overview.currentBlock}
              submitting={submitting}
              masteryLoading={masteryLoading}
              suggestedWordsCount={suggestedWordsCount}
              masteryMap={masteryMap}
              actionTitle="Продолжить тренировку"
              actionSubtitle="С того места, где остановился"
              onStartOrResume={() => {
                setEnteredSessionId(session.id);
              }}
            />
          )}

        {!loading &&
          isSessionEntered &&
          !postPracticeTransitioning &&
          session &&
          task &&
          task.mode === "recognition" &&
          !practiceView &&
          !isNewWordIntroVisible &&
          (!task.isNewWord || introducedWordKeys[task.wordKey]) &&
          renderRecognition(task)}
        {!loading &&
          isSessionEntered &&
          !postPracticeTransitioning &&
          session &&
          task &&
          task.mode === "reinforcement" &&
          !practiceView &&
          renderReinforcement(task)}
        {!loading &&
          isSessionEntered &&
          postPracticeTransitioning &&
          !practiceView && (
            <div
              className="section"
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: 180,
                borderRadius: 22,
              }}
            >
              <div style={{ color: "var(--tg-subtle)", fontWeight: 600 }}>
                Загрузка следующего упражнения...
              </div>
            </div>
          )}
        {!loading && isSessionEntered && practiceView && (
          <PracticeSnippetCard
            word={practiceView.word}
            snippets={practiceView.snippets}
            loading={practiceLoading}
          />
        )}
        {!loading &&
          isSessionEntered &&
          session &&
          task &&
          task.mode === "recognition" &&
          renderBottomActionPanel({
            visible:
              recognitionChecked &&
              !practiceView &&
              (!task.isNewWord || introducedWordKeys[task.wordKey]),
            isCorrect: recognitionResult === "correct",
            title: recognitionResult === "correct" ? "Отлично!" : "Неправильно",
            subtitle: `${task.word} - ${task.translation}`,
            onNext: () => {
              void proceedAfterRecognition(task);
            },
          })}
        {!loading &&
          isSessionEntered &&
          introPendingWord &&
          renderBottomActionPanel({
            visible: isNewWordIntroVisible,
            isCorrect: true,
            title: "",
            subtitle: null,
            hideMessageBox: true,
            buttonLabel: "Понятно",
            onNext: () => {
              setIntroducedWordKeys((prev) => ({
                ...prev,
                [introPendingWord.wordKey]: true,
              }));
            },
          })}

        {!loading &&
          isSessionEntered &&
          session &&
          task &&
          task.mode === "reinforcement" &&
          renderBottomActionPanel({
            visible:
              (task.reinforcement.type === "match_pairs"
                ? isReinforcementCorrect
                : reinforcementChecked) && !practiceView,
            isCorrect: isReinforcementCorrect,
            title: isReinforcementCorrect ? "Отлично!" : "Неправильно",
            subtitle:
              task.reinforcement.type === "audio_assemble" &&
              !isReinforcementCorrect &&
              task.reinforcement.sentence
                ? `Правильно: ${task.reinforcement.sentence}${
                    task.reinforcement.sentenceTranslation
                      ? ` • Перевод: ${task.reinforcement.sentenceTranslation}`
                      : ""
                  }`
                : task.reinforcement.sentenceTranslation &&
                    task.reinforcement.type !== "match_pairs"
                  ? `Перевод: ${task.reinforcement.sentenceTranslation}`
                  : null,
            onNext: () => {
              void proceedAfterReinforcement();
            },
          })}

        {!loading &&
          isSessionEntered &&
          practiceView &&
          renderBottomActionPanel({
            visible: !practiceLoading,
            isCorrect: true,
            title: "Продолжаем",
            subtitle: null,
            hideMessageBox: true,
            onNext: () => {
              void continueAfterPractice();
            },
          })}

        {animatingCellId && typeof document !== "undefined"
          ? createPortal(
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 90,
                  pointerEvents: "none",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <div className="mastery-cell-modal-overlay" />
                <div className="mastery-cell-modal" />
              </div>,
              document.body,
            )
          : null}

        {!loading && session && !task && (
          <TrainingCompletionView
            stage={completionStage}
            wordsCompleted={session.wordsCompleted}
            xpEarned={session.xpEarned}
            totalWordsToday={state?.summary?.totalWordsToday ?? 0}
            totalXpToday={state?.summary?.totalXpToday ?? 0}
            masteryMap={masteryMap}
            animatedFilledCellIds={animatedFilledCellIds}
            submitting={submitting}
            onRestart={() => {
              void load();
            }}
          />
        )}
      </TrainingPageRoot>
    </PageShell>
  );
}
