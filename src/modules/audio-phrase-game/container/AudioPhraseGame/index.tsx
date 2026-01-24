import { useEffect, useMemo, useRef, useState } from 'react';

import { audioPhraseGameApi } from '../../api';
import { audioPhraseLevelsApi } from '../../../../features/audio-phrase-levels/api';
import { AudioPhraseGameView } from '../../components/AudioPhraseGameView';
import { AUDIO_PHRASE_GAME_TEXT } from '../../copy';
import { useAppDispatch } from '../../../../app/hooks';
import { setLastDifficulty, setLastPlayedAt } from '../../store/slice';
import type { GamePhase, GameSnippet } from '../../types';
import type { AudioPhraseGameProps } from './types';

const XP_PER_PHRASE = 25;
const EXTRA_WORDS = [
  'a',
  'an',
  'the',
  'to',
  'in',
  'on',
  'with',
  'for',
  'and',
  'or',
  'but',
  'not',
  'do',
  'did',
  'does',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'have',
  'has',
  'had',
  'can',
  'could',
  'will',
  'would',
  'should',
  'this',
  'that',
  'here',
  'there',
  'now',
  'then',
  'what',
  'why',
  'how',
];

const TEXT = AUDIO_PHRASE_GAME_TEXT;
const CORRECT_MESSAGES = [
  "Верно!",
  "Отлично!",
  "Правильно!",
  "Супер!",
  "Класс!",
  "Так держать!",
  "Молодец!",
  "Именно!",
];

const pickCorrectMessage = () =>
  CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)] ??
  "Верно!";

const normalizePhrase = (value: string) => value.replace(/[,.!?]/g, '');
const countWords = (value: string) =>
  normalizePhrase(value)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean).length;

const shuffleWords = (input: string[]) => {
  const next = [...input];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const shuffleItems = <T,>(input: T[]) => {
  const next = [...input];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const uniqueById = <T extends { id: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const removeOneWord = (items: string[], value: string) => {
  const index = items.findIndex((item) => item === value);
  if (index === -1) return items;
  const next = [...items];
  next.splice(index, 1);
  return next;
};

export function AudioPhraseGameContainer({
  userId,
  onXp,
  maxRounds = 1,
  showHeader = false,
  difficulty = 1,
  levelId,
  onLevelComplete,
}: AudioPhraseGameProps) {
  const dispatch = useAppDispatch();
  const [currentSnippet, setCurrentSnippet] = useState<GameSnippet | null>(null);
  const [loading, setLoading] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [gameItems, setGameItems] = useState<GameSnippet[]>([]);
  const [poolItems, setPoolItems] = useState<GameSnippet[]>([]);
  const [phase, setPhase] = useState<GamePhase>('translate');
  const [questionMessage, setQuestionMessage] = useState<string | null>(null);
  const [questionCorrect, setQuestionCorrect] = useState<boolean | null>(null);
  const [missingIndices, setMissingIndices] = useState<number[]>([]);
  const [missingSlots, setMissingSlots] = useState<(string | null)[]>([]);
  const [missingOptions, setMissingOptions] = useState<string[]>([]);
  const [missingShake, setMissingShake] = useState(false);
  const missingOptionsRef = useRef<string[]>([]);
  const [oddWordOptions, setOddWordOptions] = useState<string[]>([]);
  const [oddWordAnswer, setOddWordAnswer] = useState<string | null>(null);
  const [selectedOddWord, setSelectedOddWord] = useState<string | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null);
  const [oddWordShake, setOddWordShake] = useState(false);
  const [isAnswerWrong, setIsAnswerWrong] = useState(false);
  const phasePriority: GamePhase[] = ['missing', 'assemble', 'oddword', 'translate'];
  const [phasePlan, setPhasePlan] = useState<GamePhase[]>([]);
  const levelCompletedRef = useRef(false);
  const lastProgressKeyRef = useRef<string | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastResultRef = useRef<boolean | null>(null);

  const currentItem = gameItems[roundIndex] ?? null;
  const currentPhrase = normalizePhrase(currentItem?.phrase ?? '');
  const currentWords = useMemo(() => {
    return currentPhrase
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);
  }, [currentPhrase]);
  const translationOptions = currentItem?.translationOptions ?? [];
  const showTranslationQuestion = translationOptions.length >= 2;
  const showMissingQuestion = missingIndices.length > 0 && currentWords.length >= 2;
  const showOddWordQuestion = Boolean(oddWordAnswer) && currentWords.length >= 3;
  const showAssembleQuestion =
    countWords(currentPhrase) >= 3 && countWords(currentPhrase) <= 7;

  useEffect(() => {
    dispatch(setLastPlayedAt(new Date().toISOString()));
  }, [dispatch]);

  useEffect(() => {
    dispatch(setLastDifficulty(difficulty));
  }, [dispatch, difficulty]);

  useEffect(() => {
    successAudioRef.current = new Audio('/sounds/right.wav');
    errorAudioRef.current = new Audio('/sounds/wrong.wav');
    if (successAudioRef.current) successAudioRef.current.volume = 0.7;
    if (errorAudioRef.current) errorAudioRef.current.volume = 0.7;
  }, []);

  useEffect(() => {
    lastResultRef.current = null;
  }, [currentItem?.id]);

  useEffect(() => {
    setSlots(currentWords.map(() => null));
    const baseSet = new Set(currentWords.map((word) => word.toLowerCase()));
    const targetExtraCount = difficulty === 1 ? 0 : difficulty === 2 ? 3 : 6;
    const extras =
      targetExtraCount === 0
        ? []
        : shuffleWords(EXTRA_WORDS.filter((word) => !baseSet.has(word))).slice(
            0,
            targetExtraCount,
          );
    setAvailableWords(shuffleWords([...currentWords, ...extras]));
    setMessage(null);
    setIsCorrect(null);
    setHasAnswered(false);
  }, [currentWords, difficulty]);

  useEffect(() => {
    if (!currentItem) return;
    const availablePhases: GamePhase[] = [];
    if (showMissingQuestion) availablePhases.push('missing');
    if (showAssembleQuestion) availablePhases.push('assemble');
    if (showOddWordQuestion) availablePhases.push('oddword');
    if (showTranslationQuestion) availablePhases.push('translate');
    const plannedPhase = phasePlan[roundIndex] ?? phasePriority[0];
    const nextPhase = availablePhases.includes(plannedPhase)
      ? plannedPhase
      : phasePriority.find((phaseKey) => availablePhases.includes(phaseKey)) ??
        availablePhases[0] ??
        'translate';
    setPhase(nextPhase);
    setQuestionMessage(null);
    setQuestionCorrect(null);
  }, [
    currentItem,
    phasePlan,
    roundIndex,
    showTranslationQuestion,
    showMissingQuestion,
    showOddWordQuestion,
    showAssembleQuestion,
  ]);

  useEffect(() => {
    if (!currentWords.length) {
      setMissingIndices([]);
      setMissingSlots([]);
      setMissingOptions([]);
      setOddWordOptions([]);
      setOddWordAnswer(null);
      return;
    }

    const poolWords = poolItems
      .flatMap((item) =>
        normalizePhrase(item.phrase)
          .split(/\s+/)
          .map((word) => word.trim())
          .filter(Boolean),
      )
      .filter((word) => !currentWords.includes(word));

    const uniquePoolWords = Array.from(new Set(poolWords));
    const wordIndices = currentWords.map((_, idx) => idx);
    const missingCount = currentWords.length >= 6 ? 2 : 1;
    const shuffledIndices = shuffleItems(wordIndices)
      .slice(0, missingCount)
      .sort((a, b) => a - b);
    const targetWords = shuffledIndices.map((idx) => currentWords[idx]);
    const distractors = shuffleItems(
      uniquePoolWords.filter((word) => word.length >= 2),
    ).slice(0, Math.max(2, missingCount + 1));
    const options = shuffleItems(
      Array.from(new Set([...targetWords, ...distractors])),
    );
    setMissingIndices(shuffledIndices);
    setMissingSlots(shuffledIndices.map(() => null));
    setMissingOptions(options);
    missingOptionsRef.current = options;

    const extraFallback = shuffleItems(
      EXTRA_WORDS.filter((word) => !currentWords.includes(word)),
    )[0];
    const oddWord =
      shuffleItems(
        uniquePoolWords.filter(
          (word) => !currentWords.includes(word) && word.length > 1,
        ),
      )[0] ?? extraFallback ?? '';
    const uniquePhraseWords = Array.from(
      new Set(currentWords.map((word) => word.toLowerCase())),
    );
    const phraseOptions = shuffleItems(uniquePhraseWords).slice(
      0,
      Math.min(3, uniquePhraseWords.length),
    );
    const oddOptions = oddWord
      ? shuffleItems(Array.from(new Set([...phraseOptions, oddWord]))).slice(0, 4)
      : shuffleItems(Array.from(new Set(phraseOptions))).slice(0, 3);
    setOddWordOptions(oddOptions);
    setOddWordAnswer(oddWord || null);
  }, [currentWords, poolItems]);

  useEffect(() => {
    let cancelled = false;
    const loadLevel = async () => {
      if (!levelId) return;
      setLoading(true);
      try {
        const level = await audioPhraseLevelsApi.getLevel(levelId, userId);
        if (cancelled) return;
        const items =
          level.levelSnippets?.map((entry) => ({
            id: entry.snippet.id,
            contentId: String(entry.snippet.contentId),
            videoName: entry.snippet.videoName ?? '',
            videoUrl: entry.snippet.videoUrl ?? '',
            startSeconds: entry.snippet.startSeconds,
            endSeconds: entry.snippet.endSeconds,
            phrase: entry.snippet.phrase,
            translation: entry.snippet.translation ?? null,
            wordCount: entry.snippet.phrase
              ? countWords(entry.snippet.phrase)
              : 0,
            wordCountOptions: [],
            translationOptions: [],
          })) ?? [];
        const translations = items
          .map((item) => item.translation)
          .filter((value): value is string => Boolean(value));
        const withOptions = items.map((item) => {
          if (!item.translation) return item;
          const pool = translations.filter((value) => value !== item.translation);
          const distractors = shuffleItems(pool).slice(0, 3);
          const options = shuffleItems([item.translation, ...distractors]);
          return { ...item, translationOptions: options };
        });
        const uniqueWithOptions = uniqueById(withOptions);
        setPoolItems(uniqueWithOptions);
        setGameItems(uniqueWithOptions.slice(0, maxRounds));
        levelCompletedRef.current = false;
      } catch {
        if (!cancelled) setGameItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadLevel();
    return () => {
      cancelled = true;
    };
  }, [levelId, maxRounds, userId]);

  useEffect(() => {
    if (!currentItem) return;
    if (!levelId) return;
    const resultState =
      questionCorrect !== null
        ? questionCorrect
        : isCorrect !== null
          ? isCorrect
          : null;
    if (resultState === null) return;
    const key = `${currentItem.id}:${phase}`;
    if (lastProgressKeyRef.current === key) return;
    lastProgressKeyRef.current = key;
    audioPhraseLevelsApi
      .recordProgress(
        levelId,
        {
          snippetId: currentItem.id,
          exerciseType:
            phase === 'missing'
              ? 'MISSING'
              : phase === 'assemble'
                ? 'ASSEMBLE'
                : phase === 'oddword'
                  ? 'ODDWORD'
                  : 'TRANSLATE',
          isCorrect: resultState,
        },
        userId,
      )
      .then((result) => {
        if (result.completed && !levelCompletedRef.current) {
          levelCompletedRef.current = true;
          onLevelComplete?.(result.xpReward ?? 0);
        }
      })
      .catch(() => null);
  }, [currentItem, levelId, phase, questionCorrect, isCorrect, userId, onLevelComplete, onXp]);

  useEffect(() => {
    if (!gameItems.length) return;
    const totalRounds = gameItems.length;
    const baseCount = Math.floor(totalRounds / phasePriority.length);
    const remainder = totalRounds % phasePriority.length;
    const phases: GamePhase[] = [];

    phasePriority.forEach((phaseKey, index) => {
      const count = baseCount + (index < remainder ? 1 : 0);
      for (let i = 0; i < count; i += 1) {
        phases.push(phaseKey);
      }
    });

    setPhasePlan(shuffleItems(phases));
  }, [gameItems.length]);


  useEffect(() => {
    setCurrentSnippet(currentItem ?? null);
    setSelectedTranslation(null);
    setSelectedOddWord(null);
    setQuestionMessage(null);
    setQuestionCorrect(null);
    setMissingSlots((prev) => prev.map(() => null));
    setIsAnswerWrong(false);
    setOddWordShake(false);
    setMissingShake(false);
    setShowCheck(false);
  }, [currentItem]);

  useEffect(() => {
    const resultState =
      questionCorrect !== null
        ? questionCorrect
        : isCorrect !== null
          ? isCorrect
          : null;
    if (resultState === null) return;
    if (lastResultRef.current === resultState) return;
    lastResultRef.current = resultState;
    const audio = resultState ? successAudioRef.current : errorAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => undefined);
  }, [questionCorrect, isCorrect]);

  useEffect(() => {
    if (phase === 'missing' && !showMissingQuestion) {
      setPhase(showOddWordQuestion ? 'oddword' : 'assemble');
    }
  }, [phase, showMissingQuestion, showOddWordQuestion]);

  useEffect(() => {
    if (phase === 'oddword' && !showOddWordQuestion) {
      setPhase('assemble');
    }
  }, [phase, showOddWordQuestion]);

  useEffect(() => {
    setQuestionMessage(null);
    setIsAnswerWrong(false);
  }, [phase]);

  const advancePhase = () => {
    setQuestionMessage(null);
    setQuestionCorrect(null);
    setMissingSlots([]);
    setMissingIndices([]);
    setRoundIndex((idx) => Math.min(idx + 1, gameItems.length));
  };

  const handleTranslationAnswer = (value: string) => {
    if (!currentItem || questionCorrect !== null || hasAnswered) return;
    setQuestionMessage(null);
    setIsAnswerWrong(false);
    const correct = value === currentItem.translation;
    setSelectedTranslation(value);
    if (correct) {
      setQuestionCorrect(true);
      setQuestionMessage(pickCorrectMessage());
      setIsAnswerWrong(false);
      return;
    }
    setQuestionMessage(TEXT.wrongAnswer);
    setIsAnswerWrong(true);
    setQuestionCorrect(false);
    setHasAnswered(true);
  };

  const handleMissingPick = (value: string) => {
    if (questionCorrect !== null || hasAnswered) return;
    setQuestionMessage(null);
    setIsAnswerWrong(false);
    setMissingSlots((prev) => {
      const idx = prev.findIndex((slot) => !slot);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = value;
      return next;
    });
    setMissingOptions((prev) => prev.filter((option) => option !== value));
  };

  useEffect(() => {
    if (phase !== 'missing') return;
    if (questionCorrect !== null) return;
    if (!missingSlots.length || missingSlots.some((slot) => !slot)) return;
    const isCorrectMissing = missingIndices.every(
      (idx, i) =>
        String(missingSlots[i]).toLowerCase() ===
        String(currentWords[idx]).toLowerCase(),
    );
    if (isCorrectMissing) {
      setQuestionCorrect(true);
      setQuestionMessage(pickCorrectMessage());
      setIsAnswerWrong(false);
      return;
    }
    setQuestionMessage(TEXT.wrongAnswer);
    setIsAnswerWrong(true);
    setMissingShake(true);
    setQuestionCorrect(false);
    setHasAnswered(true);
    setTimeout(() => {
      setMissingShake(false);
      setIsAnswerWrong(false);
    }, 2000);
  }, [phase, questionCorrect, missingSlots, missingIndices, currentWords]);

  const handleMissingRemove = (slotIndex: number) => {
    if (questionCorrect !== null || hasAnswered) return;
    setQuestionMessage(null);
    setIsAnswerWrong(false);
    setMissingSlots((prev) => {
      const next = [...prev];
      const value = next[slotIndex];
      next[slotIndex] = null;
      if (value) {
        setMissingOptions((options) =>
          options.includes(value) ? options : [...options, value],
        );
      }
      return next;
    });
  };

  const handleOddWordPick = (value: string) => {
    if (questionCorrect !== null || hasAnswered) return;
    setQuestionMessage(null);
    setIsAnswerWrong(false);
    const correct = value === oddWordAnswer;
    setSelectedOddWord(value);
    if (correct) {
      setQuestionCorrect(true);
      setQuestionMessage(pickCorrectMessage());
      setIsAnswerWrong(false);
      return;
    }
    setQuestionMessage(TEXT.wrongAnswer);
    setIsAnswerWrong(true);
    setQuestionCorrect(false);
    setHasAnswered(true);
    setOddWordShake(true);
    setTimeout(() => {
      setOddWordShake(false);
      setIsAnswerWrong(false);
    }, 2000);
  };

  const handleWordDrop = (word: string, slotIndex: number) => {
    if (questionCorrect !== null || hasAnswered) return;
    setSlots((prev) => {
      if (prev[slotIndex]) return prev;
      const next = [...prev];
      next[slotIndex] = word;
      return next;
    });
    setAvailableWords((prev) => removeOneWord(prev, word));
  };

  const handleReturnWord = (word: string) => {
    if (questionCorrect !== null || hasAnswered) return;
    setSlots((prev) => {
      const index = prev.findIndex((slot) => slot === word);
      if (index === -1) return prev;
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setAvailableWords((prev) => [...prev, word]);
  };

  const handleWordClick = (word: string) => {
    if (questionCorrect !== null || hasAnswered) return;
    setSlots((prev) => {
      const idx = prev.findIndex((slot) => !slot);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = word;
      return next;
    });
    setAvailableWords((prev) => removeOneWord(prev, word));
  };

  const handleSlotClick = (slotIndex: number) => {
    if (questionCorrect !== null || hasAnswered) return;
    setSlots((prev) => {
      const word = prev[slotIndex];
      if (!word) return prev;
      const next = [...prev];
      next[slotIndex] = null;
      setAvailableWords((words) => [...words, word]);
      return next;
    });
  };

  useEffect(() => {
    if (hasAnswered) return;
    if (!slots.length || slots.some((slot) => !slot)) return;
    const answer = slots.join(' ').toLowerCase();
    const target = currentWords.join(' ').toLowerCase();
    const correct = answer === target;
    setIsCorrect(correct);
    setMessage(correct ? pickCorrectMessage() : TEXT.wrongAnswer);
    if (!correct) {
      setShowCheck(true);
      setHasAnswered(true);
      return;
    }
    setHasAnswered(true);
    if (userId) {
      audioPhraseGameApi
        .addXp(XP_PER_PHRASE, userId)
        .then((result) => onXp(result.xpPoints))
        .catch(() => null);
    }
  }, [currentWords, hasAnswered, onXp, maxRounds, slots, userId]);

  const isFinished = roundIndex >= gameItems.length;

  return (
    <AudioPhraseGameView
      showHeader={showHeader}
      roundIndex={roundIndex}
      totalRounds={gameItems.length}
      phase={phase}
      loading={loading}
      isFinished={isFinished}
      currentSnippet={currentSnippet}
      currentItem={currentItem}
      currentWords={currentWords}
      translationOptions={translationOptions}
      showTranslationQuestion={showTranslationQuestion}
      showMissingQuestion={showMissingQuestion}
      showOddWordQuestion={showOddWordQuestion}
      missingIndices={missingIndices}
      missingSlots={missingSlots}
      missingOptions={missingOptions}
      missingShake={missingShake}
      oddWordOptions={oddWordOptions}
      oddWordAnswer={oddWordAnswer}
      selectedOddWord={selectedOddWord}
      selectedTranslation={selectedTranslation}
      oddWordShake={oddWordShake}
      slots={slots}
      availableWords={availableWords}
      message={message}
      isCorrect={isCorrect}
      showCheck={showCheck}
      questionMessage={questionMessage}
      questionCorrect={questionCorrect}
      isAnswerWrong={isAnswerWrong}
      onTranslationAnswer={handleTranslationAnswer}
      onMissingPick={handleMissingPick}
      onMissingRemove={handleMissingRemove}
      onOddWordPick={handleOddWordPick}
      onAdvancePhase={advancePhase}
      onWordDrop={handleWordDrop}
      onReturnWord={handleReturnWord}
      onWordClick={handleWordClick}
      onSlotClick={handleSlotClick}
    />
  );
}
