import { AUDIO_PHRASE_GAME_TEXT } from "../../copy";
import type { AudioPhraseGameViewProps } from "./types";
import {
  AvailableWordsRow,
  CenteredGrid,
  CenteredRow,
  FooterRow,
  GameCard,
  InfoText,
  LifeHeart,
  LivesRow,
  MissingOptionsRow,
  MissingOptionButton,
  OddWordOptionsGrid,
  MissingSentence,
  MissingSlot,
  NextButton,
  OptionButton,
  PhraseLine,
  PhraseReveal,
  PhaseTitle,
  QuestionMessage,
  QuestionSection,
  SkipButton,
  SkipRow,
  SlotWord,
  SlotBox,
  SlotRow,
  StatusBanner,
  TopSection,
  WordChip,
} from "./styles";
import { SnippetPlayer } from "../SnippetPlayer";
import { Icon } from "../../../../shared/ui/Icon";

const TEXT = AUDIO_PHRASE_GAME_TEXT;
const normalizeRevealPhrase = (value: string) => value.replace(/[.!?]\s*$/, "");

export function AudioPhraseGameView({
  lives,
  phase,
  loading,
  isFinished,
  outOfLives,
  currentSnippet,
  currentItem,
  currentWords,
  translationOptions,
  showTranslationQuestion,
  showMissingQuestion,
  showOddWordQuestion,
  missingIndices,
  missingSlots,
  missingOptions,
  missingShake,
  oddWordOptions,
  oddWordAnswer,
  selectedOddWord,
  selectedTranslation,
  oddWordShake,
  slots,
  availableWords,
  message,
  isCorrect,
  showCheck,
  questionMessage,
  questionCorrect,
  isAnswerWrong,
  showSkip,
  onTranslationAnswer,
  onMissingPick,
  onMissingRemove,
  onOddWordPick,
  onAdvancePhase,
  onWordDrop,
  onReturnWord,
  onWordClick,
  onSlotClick,
}: AudioPhraseGameViewProps) {
  const phaseTitle =
    phase === "translate"
      ? TEXT.translationTitle
      : phase === "missing"
        ? TEXT.missingTitle
        : phase === "oddword"
          ? TEXT.oddWordTitle
          : phase === "assemble"
            ? TEXT.assembleTitle
            : TEXT.defaultTitle;

  return (
    <>
      {/* <AudioPhraseGameGlobalStyles /> */}
      <TopSection>
        <LivesRow>
          {Array.from({ length: 3 }).map((_, index) => (
            <LifeHeart key={`life-${index}`} $active={index < lives}>
              <Icon name="like" size={40} color="#ff6b6b" fillColor="#ff6b6b" />
            </LifeHeart>
          ))}
        </LivesRow>
      </TopSection>
      <GameCard>
        {loading && <InfoText>{TEXT.loading}</InfoText>}
        {!loading && !isFinished && currentSnippet && (
          <>
            <PhaseTitle>{phaseTitle}</PhaseTitle>
            <SnippetPlayer snippet={currentSnippet} />
          </>
        )}

        {!loading && !isFinished && !currentSnippet && (
          <InfoText>{TEXT.empty}</InfoText>
        )}

        {!loading && outOfLives && (
          <StatusBanner $tone="danger">{TEXT.gameOver}</StatusBanner>
        )}

        {!loading && isFinished && !outOfLives && (
          <StatusBanner $tone="info">{TEXT.finished}</StatusBanner>
        )}

        {!loading &&
          !isFinished &&
          !outOfLives &&
          phase === "translate" &&
          showTranslationQuestion && (
            <QuestionSection>
              <CenteredGrid>
                {translationOptions.map((option) => {
                  const isCorrectOption =
                    option === currentItem?.translation && questionCorrect;
                  const isWrongOption =
                    option === selectedTranslation && isAnswerWrong;
                  const state = isCorrectOption
                    ? "correct"
                    : isWrongOption
                      ? "wrong"
                      : "normal";
                  return (
                    <OptionButton
                      key={`translation-${option}`}
                      type="button"
                      onClick={() => onTranslationAnswer(option)}
                      disabled={questionCorrect !== null || outOfLives}
                      $state={state}
                    >
                      {option}
                    </OptionButton>
                  );
                })}
              </CenteredGrid>
              {questionMessage && (
                <QuestionMessage $success={Boolean(questionCorrect)}>
                  {questionMessage}
                </QuestionMessage>
              )}
              {questionCorrect !== null && (
                <QuestionSection>
                  {currentItem && (
                    <PhraseReveal>
                      <PhraseLine>
                        {normalizeRevealPhrase(currentItem.phrase)}
                        {currentItem.translation
                          ? ` — ${currentItem.translation}`
                          : ""}
                      </PhraseLine>
                    </PhraseReveal>
                  )}
                  <CenteredRow>
                    <NextButton
                      type="button"
                      onClick={onAdvancePhase}
                      className="apg-next"
                    >
                      {TEXT.next}
                    </NextButton>
                  </CenteredRow>
                </QuestionSection>
              )}
              {outOfLives && questionCorrect === null && (
                <CenteredRow>
                  <NextButton
                    type="button"
                    onClick={onAdvancePhase}
                    className="apg-next"
                    $size={22}
                  >
                    {TEXT.next}
                  </NextButton>
                </CenteredRow>
              )}
            </QuestionSection>
          )}

        {!loading &&
          !isFinished &&
          !outOfLives &&
          phase === "missing" &&
          showMissingQuestion && (
            <QuestionSection>
              <MissingSentence>
                {currentWords.map((word, index) => {
                  const missingIndex = missingIndices.indexOf(index);
                  if (missingIndex === -1) {
                    return <span key={`word-${index}`}>{word} </span>;
                  }
                  const slotValue = missingSlots[missingIndex];
                  const isSlotCorrect =
                    slotValue &&
                    slotValue.toLowerCase() ===
                      currentWords[index]?.toLowerCase();
                  const showSlotCheck =
                    questionCorrect !== null || isAnswerWrong;
                  return (
                    <MissingSlot
                      key={`missing-${index}`}
                      onClick={() => onMissingRemove(missingIndex)}
                      $correct={Boolean(isSlotCorrect)}
                      $showCheck={showSlotCheck}
                      $shake={missingShake && isAnswerWrong}
                      $clickable={Boolean(slotValue)}
                    >
                      {slotValue ?? "_____"}
                    </MissingSlot>
                  );
                })}
              </MissingSentence>
              {questionCorrect === null && !outOfLives && (
                <MissingOptionsRow>
                  {missingOptions.map((option) => (
                    <MissingOptionButton
                      key={`missing-option-${option}`}
                      type="button"
                      onClick={() => onMissingPick(option)}
                      disabled={questionCorrect !== null || outOfLives}
                    >
                      {option}
                    </MissingOptionButton>
                  ))}
                </MissingOptionsRow>
              )}
              {questionMessage && (
                <QuestionMessage $success={Boolean(questionCorrect)}>
                  {questionMessage}
                </QuestionMessage>
              )}
              {questionCorrect !== null && (
                <QuestionSection>
                  {currentItem && (
                    <PhraseReveal>
                      <PhraseLine>
                        {normalizeRevealPhrase(currentItem.phrase)}
                        {currentItem.translation
                          ? ` — ${currentItem.translation}`
                          : ""}
                      </PhraseLine>
                    </PhraseReveal>
                  )}
                  <CenteredRow>
                    <NextButton
                      type="button"
                      onClick={onAdvancePhase}
                      className="apg-next"
                    >
                      {TEXT.next}
                    </NextButton>
                  </CenteredRow>
                </QuestionSection>
              )}
              {outOfLives && questionCorrect === null && (
                <CenteredRow>
                  <NextButton
                    type="button"
                    onClick={onAdvancePhase}
                    className="apg-next"
                    $size={22}
                  >
                    {TEXT.next}
                  </NextButton>
                </CenteredRow>
              )}
            </QuestionSection>
          )}

        {!loading &&
          !isFinished &&
          !outOfLives &&
          phase === "oddword" &&
          showOddWordQuestion && (
            <QuestionSection>
              {questionCorrect === null && !outOfLives && (
                <OddWordOptionsGrid>
                  {oddWordOptions.map((option) => {
                    const isCorrectOption =
                      option === oddWordAnswer && questionCorrect;
                    const isWrongOption =
                      option === selectedOddWord && isAnswerWrong;
                    const state = isCorrectOption
                      ? "correct"
                      : isWrongOption
                        ? "wrong"
                        : "normal";
                    return (
                      <OptionButton
                        key={`odd-option-${option}`}
                        type="button"
                        onClick={() => onOddWordPick(option)}
                        disabled={questionCorrect !== null || outOfLives}
                        $state={state}
                        $shake={
                          oddWordShake &&
                          option === selectedOddWord &&
                          isAnswerWrong
                        }
                      >
                        {option}
                      </OptionButton>
                    );
                  })}
                </OddWordOptionsGrid>
              )}
              {questionMessage && (
                <QuestionMessage $success={Boolean(questionCorrect)}>
                  {questionMessage}
                </QuestionMessage>
              )}
              {questionCorrect && currentItem && (
                <PhraseReveal>
                  <PhraseLine>
                    {normalizeRevealPhrase(currentItem.phrase)}
                    {currentItem.translation
                      ? ` — ${currentItem.translation}`
                      : ""}
                  </PhraseLine>
                </PhraseReveal>
              )}
              {(questionCorrect !== null || outOfLives) && (
                <CenteredRow>
                  <NextButton
                    type="button"
                    onClick={onAdvancePhase}
                    className="apg-next"
                    $size={18}
                  >
                    {TEXT.next}
                  </NextButton>
                </CenteredRow>
              )}
            </QuestionSection>
          )}

        {!loading && !isFinished && !outOfLives && phase === "assemble" && (
          <>
            <SlotRow>
              {slots.map((slot, index) => {
                const isCorrectSlot =
                  slot &&
                  slot.toLowerCase() ===
                    (currentWords[index] ?? "").toLowerCase();
                const shouldShowWrong = Boolean(
                  showCheck && slot && !isCorrectSlot,
                );
                const state =
                  isCorrect && slot
                    ? "correct"
                    : shouldShowWrong
                      ? "wrong"
                      : slot
                        ? "filled"
                        : "empty";

                return (
                  <SlotBox
                    key={`slot-${index}`}
                    className={`apg-slot ${slot ? "apg-slot--filled" : "apg-slot--empty"}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const word = event.dataTransfer.getData("text/plain");
                      if (!word) return;
                      onWordDrop(word, index);
                    }}
                    $state={state}
                    $shake={shouldShowWrong}
                  >
                    {slot && (
                      <SlotWord
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", slot);
                        }}
                        onClick={() => onSlotClick(index)}
                        title={TEXT.slotHint}
                      >
                        {slot}
                      </SlotWord>
                    )}
                  </SlotBox>
                );
              })}
            </SlotRow>

            {!isCorrect && (
              <AvailableWordsRow
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const word = event.dataTransfer.getData("text/plain");
                  if (!word) return;
                  onReturnWord(word);
                }}
              >
                {availableWords.map((word, index) => (
                  <WordChip
                    key={`${word}-${index}`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", word);
                    }}
                    onClick={() => onWordClick(word)}
                    className="apg-word"
                  >
                    {word}
                  </WordChip>
                ))}
              </AvailableWordsRow>
            )}

            {message && (
              <QuestionMessage $success={Boolean(isCorrect)}>
                {message}
              </QuestionMessage>
            )}
            {isCorrect && currentItem && (
              <PhraseReveal>
                <PhraseLine>
                  {normalizeRevealPhrase(currentItem.phrase)}
                  {currentItem.translation
                    ? ` — ${currentItem.translation}`
                    : ""}
                </PhraseLine>
              </PhraseReveal>
            )}
            <FooterRow>
              {(isCorrect || outOfLives) && (
                <NextButton
                  type="button"
                  onClick={onAdvancePhase}
                  className="apg-next"
                >
                  {TEXT.next}
                </NextButton>
              )}
            </FooterRow>
          </>
        )}
      </GameCard>
      {showSkip && !isFinished && (
        <SkipRow>
          <SkipButton type="button" onClick={onAdvancePhase}>
            {TEXT.skip}
          </SkipButton>
        </SkipRow>
      )}
    </>
  );
}
