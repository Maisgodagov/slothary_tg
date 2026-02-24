import type { ReinforcementCardProps } from './types';
import {
  AssembleLine,
  AssembleWordChip,
  BankWrap,
  Card,
  HeaderRow,
  MissingOptionsGrid,
  MissingSentence,
  OptionButton,
  PairsColumn,
  PairsGrid,
  SlotChip,
  Title,
  TokenButton,
  TranslationText,
} from './styles';

export function ReinforcementCard({
  reinforcement,
  submitting,
  reinforcementChecked,
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
  onSpeakWord,
  onPlayFeedbackSound,
}: ReinforcementCardProps) {
  const sentenceTranslation = reinforcement.reinforcement.sentenceTranslation?.trim() || null;

  const renderMissingExercise = () => {
    if (!missingExerciseModel) return null;
    const options = missingExerciseModel.options;
    const { rawTokens, blankIndexes } = missingExerciseModel;

    return (
      <>
        {sentenceTranslation ? <TranslationText>{sentenceTranslation}</TranslationText> : null}

        <MissingSentence>
          {rawTokens.map((token, index) => {
            const slotIndex = blankIndexes.findIndex((blankIndex) => blankIndex === index);
            if (slotIndex >= 0) {
              const isSlotCorrect =
                reinforcementChecked &&
                normalize(missingSelected[slotIndex] ?? '') === normalize(missingExerciseModel.expectedWords[slotIndex] ?? '');
              const isSlotWrong = reinforcementChecked && !isSlotCorrect;
              return (
                <SlotChip
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
                  style={{ cursor: !reinforcementChecked && missingSelected[slotIndex] ? 'pointer' : 'default' }}
                  $correct={isSlotCorrect}
                  $wrong={isSlotWrong}
                  $filled={Boolean(missingSelected[slotIndex])}
                >
                  {missingSelected[slotIndex] ?? ''}
                </SlotChip>
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
              <OptionButton
                key={`${option}-${index}`}
                onClick={() => {
                  if (reinforcementChecked) return;
                  onSpeakWord(option);
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
                style={{ opacity: disabledByUse ? 0.55 : 1 }}
              >
                {option}
              </OptionButton>
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
        {sentenceTranslation ? <TranslationText>{sentenceTranslation}</TranslationText> : null}

        <AssembleLine>
          {assembleAnswer.map((token, idx) => {
            const target = targetTokens[idx];
            const isTokenCorrect = reinforcementChecked && normalizeLoose(token) === normalizeLoose(target ?? '');
            const isTokenWrong = reinforcementChecked && !isTokenCorrect;
            return (
              <AssembleWordChip
                key={`assembled-${idx}-${token}`}
                className={isTokenWrong ? 'slot-shake' : undefined}
                onClick={() => {
                  if (reinforcementChecked) return;
                  onSpeakWord(token);
                  setAssembleAnswer((prev) => prev.filter((_, itemIndex) => itemIndex !== idx));
                }}
                $correct={Boolean(isTokenCorrect)}
                $wrong={Boolean(isTokenWrong)}
                style={{ cursor: reinforcementChecked ? 'default' : 'pointer' }}
              >
                {token}
              </AssembleWordChip>
            );
          })}
        </AssembleLine>

        <BankWrap>
          {availableBankTokens.map(({ token, sourceIndex }) => {
            const disabled = reinforcementChecked || assembleAnswer.length >= maxSlots;

            return (
              <TokenButton
                key={`${sourceIndex}-${token}`}
                type="button"
                onClick={() => {
                  if (disabled) return;
                  onSpeakWord(token);
                  setAssembleAnswer((prev) => [...prev, token]);
                }}
                disabled={disabled}
                style={{ opacity: disabled ? 0.75 : 1 }}
              >
                {token}
              </TokenButton>
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
              <TokenButton
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
                className={isTempWrong ? 'slot-shake' : undefined}
                style={{
                  minHeight: 56,
                  textAlign: 'left',
                  padding: '12px 14px',
                }}
                $correct={isLockedCorrect || Boolean(isCorrect)}
                $wrong={isTempWrong || Boolean(isWrong)}
                $selected={selected}
              >
                {pair.word}
              </TokenButton>
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
              <TokenButton
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
                className={isTempWrong ? 'slot-shake' : undefined}
                style={{
                  minHeight: 56,
                  textAlign: 'left',
                  padding: '12px 14px',
                  opacity: reinforcementChecked ? 0.6 : 1,
                }}
                $correct={isLockedCorrect}
                $wrong={isTempWrong}
                $selected={isSelected}
              >
                {translation}
              </TokenButton>
            );
          })}
        </PairsColumn>
      </PairsGrid>
    );
  };

  return (
    <Card className="section">
      <HeaderRow>
        <Title>
          {reinforcement.reinforcement.type === 'match_pairs'
            ? 'Соедени слова с их переводом'
            : reinforcement.reinforcement.type === 'missing'
              ? 'Вставь пропущенные слова'
              : reinforcement.reinforcement.type === 'audio_assemble'
                ? 'Собери фразу из слов'
                : 'Закрепление'}
        </Title>
      </HeaderRow>

      {reinforcement.reinforcement.type === 'missing' ? renderMissingExercise() : null}
      {reinforcement.reinforcement.type === 'audio_assemble' ? renderAudioAssembleExercise() : null}
      {reinforcement.reinforcement.type === 'match_pairs' ? renderMatchPairsExercise() : null}
    </Card>
  );
}

export default ReinforcementCard;
