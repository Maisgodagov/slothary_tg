import { Volume2 } from 'lucide-react';
import { Button } from '../../../../shared/ui/Button';
import type { ReinforcementCardProps } from './types';
import {
  AudioTopRow,
  BankWrap,
  Card,
  HeaderRow,
  IconButton,
  MissingOptionsGrid,
  MissingSentence,
  PairsColumn,
  PairsGrid,
  SlotsWrap,
  Title,
  TranslationText,
} from './styles';

export function ReinforcementCard({
  reinforcement,
  submitting,
  reinforcementChecked,
  canCheckReinforcement,
  optionButtonBaseStyle,
  slotBaseStyle,
  missingExerciseModel,
  missingSelected,
  setMissingSelected,
  assembleAnswer,
  setAssembleAnswer,
  pairMatches,
  setPairMatches,
  pairLeftSelected,
  setPairLeftSelected,
  pairRightSelected,
  setPairRightSelected,
  pairWrongWord,
  setPairWrongWord,
  pairWrongTranslation,
  setPairWrongTranslation,
  normalize,
  normalizeLoose,
  getTokenUsage,
  onPlayAudioUrl,
  onPlayFeedbackSound,
  onSubmitReinforcement,
}: ReinforcementCardProps) {
  const renderMissingExercise = () => {
    if (!missingExerciseModel) return null;
    const options = missingExerciseModel.options;
    const { rawTokens, blankIndexes } = missingExerciseModel;

    return (
      <>
        <MissingSentence>
          {rawTokens.map((token, index) => {
            const slotIndex = blankIndexes.findIndex((blankIndex) => blankIndex === index);
            if (slotIndex >= 0) {
              const isSlotCorrect =
                reinforcementChecked &&
                normalize(missingSelected[slotIndex] ?? '') === normalize(missingExerciseModel.expectedWords[slotIndex] ?? '');
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
        </MissingSentence>

        <MissingOptionsGrid>
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
        </MissingOptionsGrid>
      </>
    );
  };

  const renderAudioAssembleExercise = () => {
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
          <TranslationText>{reinforcement.reinforcement.sentenceTranslation}</TranslationText>
        ) : null}

        <SlotsWrap>
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
                  background: isSlotCorrect
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
        </SlotsWrap>

        <BankWrap>
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
        </BankWrap>
      </>
    );
  };

  const renderMatchPairsExercise = () => {
    const pairs = reinforcement.reinforcement.pairs ?? [];
    const shuffledTranslations = reinforcement.reinforcement.shuffledTranslations ?? [];

    const checkAndAssignPair = (word: string, translation: string) => {
      const target = pairs.find((pair) => pair.word === word);
      if (!target) return;

      if (normalize(target.translation) === normalize(translation)) {
        void onPlayFeedbackSound(true);
        setPairMatches((prev) => ({ ...prev, [word]: translation }));
        setPairWrongWord(null);
        setPairWrongTranslation(null);
        setPairLeftSelected(null);
        setPairRightSelected(null);
        return;
      }

      void onPlayFeedbackSound(false);
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
      <PairsGrid>
        <PairsColumn>
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
                  void onPlayAudioUrl(pair.pronunciationAudioUrl ?? null);
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
        </PairsColumn>

        <PairsColumn>
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
                  setPairRightSelected((prev) => (normalize(prev ?? '') === normalize(translation) ? null : translation));
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
        </PairsColumn>
      </PairsGrid>
    );
  };

  const isMatchPairs = reinforcement.reinforcement.type === 'match_pairs';
  const isMissing = reinforcement.reinforcement.type === 'missing';

  return (
    <Card className="section">
      <HeaderRow>
        <Title $isMatchPairs={isMatchPairs} $isMissing={isMissing}>
          {reinforcement.reinforcement.type === 'match_pairs'
            ? 'Соедини слова и их перевод'
            : reinforcement.reinforcement.type === 'missing'
            ? 'Вставь пропущенное слово'
            : reinforcement.reinforcement.type === 'audio_assemble'
            ? 'Собери фразу из слов'
            : 'Закрепление'}
        </Title>

        {isMissing ? (
          <IconButton
            type="button"
            onClick={() => void onPlayAudioUrl(reinforcement.reinforcement.phraseAudioUrl ?? null)}
            disabled={!reinforcement.reinforcement.phraseAudioUrl}
            aria-label="Проиграть аудио"
            style={{ opacity: reinforcement.reinforcement.phraseAudioUrl ? 1 : 0.45 }}
          >
            <Volume2 size={18} />
          </IconButton>
        ) : null}
      </HeaderRow>

      {reinforcement.reinforcement.type === 'audio_assemble' ? (
        <AudioTopRow>
          <IconButton
            type="button"
            onClick={() => void onPlayAudioUrl(reinforcement.pronunciationAudioUrl ?? null)}
            disabled={!reinforcement.pronunciationAudioUrl}
            aria-label="Проиграть аудио"
            style={{ opacity: reinforcement.pronunciationAudioUrl ? 1 : 0.45 }}
          >
            <Volume2 size={18} />
          </IconButton>
        </AudioTopRow>
      ) : null}

      {reinforcement.reinforcement.type === 'missing' ? renderMissingExercise() : null}
      {reinforcement.reinforcement.type === 'audio_assemble' ? renderAudioAssembleExercise() : null}
      {reinforcement.reinforcement.type === 'match_pairs' ? renderMatchPairsExercise() : null}

      {reinforcement.reinforcement.type !== 'match_pairs' && !reinforcementChecked ? (
        <Button
          onClick={onSubmitReinforcement}
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
    </Card>
  );
}

export default ReinforcementCard;

