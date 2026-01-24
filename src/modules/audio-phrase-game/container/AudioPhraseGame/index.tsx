import { useEffect, useMemo, useRef, useState } from 'react';

import { audioPhraseGameApi } from '../../api';
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

export function AudioPhraseGameContainer({
  userId,
  onXp,
  maxRounds = 1,
  showHeader = false,
  difficulty = 1,
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
  const [phasePlan, setPhasePlan] = useState<GamePhase[]>([]);
  const seenSnippetIdsRef = useRef<Set<string>>(new Set());

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
    if (showAssembleQuestion) availablePhases.push('assemble');
    if (showTranslationQuestion) availablePhases.push('translate');
    if (showMissingQuestion) availablePhases.push('missing');
    if (showOddWordQuestion) availablePhases.push('oddword');
    const plannedPhase = phasePlan[roundIndex] ?? 'translate';
    const nextPhase = availablePhases.includes(plannedPhase)
      ? plannedPhase
      : availablePhases[0] ?? 'translate';
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
    const loadPool = async () => {
      setLoading(true);
      try {
        const response = await audioPhraseGameApi.listGameSnippets({
          limit: Math.max(maxRounds * 3, maxRounds),
          minWords: 1,
        });
        if (cancelled) return;
        const items =
          response.items?.map((item) => ({
            id: item.id,
            contentId: String(item.contentId),
            videoName: item.videoName ?? '',
            videoUrl: item.videoUrl ?? '',
            startSeconds: item.startSeconds,
            endSeconds: item.endSeconds,
            phrase: item.phrase,
            translation: item.translation ?? null,
            wordCount: item.wordCount,
            wordCountOptions: item.wordCountOptions ?? [],
            translationOptions: item.translationOptions ?? [],
          })) ?? [];
        const uniqueItems = uniqueById(items);
        const eligibleItems = uniqueItems.filter(
          (item) =>
            item.translationOptions.length >= 2 &&
            item.wordCount >= 3 &&
            item.wordCount <= 7,
        );
        const unseenItems = eligibleItems.filter(
          (item) => !seenSnippetIdsRef.current.has(item.id),
        );
        unseenItems.forEach((item) => {
          seenSnippetIdsRef.current.add(item.id);
        });
        const fallbackItems = eligibleItems.length ? eligibleItems : uniqueItems;
        const effectiveItems = unseenItems.length ? unseenItems : fallbackItems;
        setPoolItems(fallbackItems);
        setGameItems(shuffleItems(effectiveItems).slice(0, maxRounds));
      } catch {
        if (!cancelled) setGameItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPool();
    return () => {
      cancelled = true;
    };
  }, [maxRounds]);

  useEffect(() => {
    if (!gameItems.length) return;
    const phases: GamePhase[] = [
      'translate',
      'translate',
      'missing',
      'missing',
      'oddword',
      'oddword',
      'assemble',
      'assemble',
    ];
    setPhasePlan(shuffleItems(phases).slice(0, gameItems.length));
  }, [gameItems]);

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
  }, [currentItem]);

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
    setAvailableWords((prev) => prev.filter((w) => w !== word));
  };

  const handleReturnWord = (word: string) => {
    if (questionCorrect !== null || hasAnswered) return;
    setSlots((prev) => prev.map((w) => (w === word ? null : w)));
    setAvailableWords((prev) => (prev.includes(word) ? prev : [...prev, word]));
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
    setAvailableWords((prev) => prev.filter((w) => w !== word));
  };

  const handleSlotClick = (slotIndex: number) => {
    if (questionCorrect !== null || hasAnswered) return;
    setSlots((prev) => {
      const word = prev[slotIndex];
      if (!word) return prev;
      const next = [...prev];
      next[slotIndex] = null;
      setAvailableWords((words) =>
        words.includes(word) ? words : [...words, word],
      );
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
