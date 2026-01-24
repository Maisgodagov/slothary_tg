import { AUDIO_PHRASE_GAME_TEXT } from "../../copy";
import type { AudioPhraseGameViewProps } from "./types";
import {
  AvailableWordsRow,
  CenteredGrid,
  FooterRow,
  GameCard,
  InfoText,
  MissingOptionsRow,
  MissingOptionButton,
  OddWordOptionsGrid,
  MissingSentence,
  MissingSlot,
  NextButton,
  OptionButton,
  PhaseTitle,
  QuestionSection,
  ResultActions,
  ResultLine,
  ResultLineEn,
  ResultLineRu,
  ResultMessage,
  ResultSheet,
  SlotWord,
  SlotBox,
  SlotRow,
  StatusBanner,
  WordChip,
} from "./styles";
import { SnippetPlayer } from "../SnippetPlayer";

const TEXT = AUDIO_PHRASE_GAME_TEXT;
const normalizeRevealPhrase = (value: string) => value.replace(/[.!?]\s*$/, "");

export function AudioPhraseGameView({
  phase,
  loading,
  isFinished,
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

  const resultMessage = questionMessage ?? message;
  const resultIsCorrect =
    typeof questionCorrect === "boolean"
      ? questionCorrect
      : typeof isCorrect === "boolean"
        ? isCorrect
        : null;
  const showResult = Boolean(resultMessage);
  const showResultNext = resultIsCorrect !== null;
  const resultButtonLabel = resultIsCorrect === false ? TEXT.ok : TEXT.next;

  return (
    <>
      {/* <AudioPhraseGameGlobalStyles /> */}
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

        {!loading && isFinished && (
          <StatusBanner $tone="info">{TEXT.finished}</StatusBanner>
        )}

        {!loading &&
          !isFinished &&
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
                      disabled={questionCorrect !== null}
                      $state={state}
                    >
                      {option}
                    </OptionButton>
                  );
                })}
              </CenteredGrid>
            </QuestionSection>
          )}

        {!loading &&
          !isFinished &&
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
                      {slotValue ?? ""}
                    </MissingSlot>
                  );
                })}
              </MissingSentence>
              <MissingOptionsRow>
                {missingOptions.map((option) => (
                  <MissingOptionButton
                    key={`missing-option-${option}`}
                    type="button"
                    onClick={() => onMissingPick(option)}
                    disabled={questionCorrect !== null}
                  >
                    {option}
                  </MissingOptionButton>
                ))}
              </MissingOptionsRow>
            </QuestionSection>
          )}

        {!loading &&
          !isFinished &&
          phase === "oddword" &&
          showOddWordQuestion && (
            <QuestionSection>
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
                      disabled={questionCorrect !== null}
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
            </QuestionSection>
          )}

        {!loading && !isFinished && phase === "assemble" && (
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

            <FooterRow />
          </>
        )}
      </GameCard>
      <ResultSheet $visible={showResult}>
        {resultMessage && (
          <ResultMessage $success={Boolean(resultIsCorrect)}>
            {resultMessage}
          </ResultMessage>
        )}
        {currentItem && (
          <ResultLine>
            <ResultLineEn>
              {normalizeRevealPhrase(currentItem.phrase)}
            </ResultLineEn>
            {currentItem.translation && (
              <ResultLineRu>{currentItem.translation}</ResultLineRu>
            )}
          </ResultLine>
        )}
        {showResultNext && (
          <ResultActions>
            <NextButton
              type="button"
              onClick={onAdvancePhase}
              className="apg-next"
            >
              {resultButtonLabel}
            </NextButton>
          </ResultActions>
        )}
      </ResultSheet>
    </>
  );
}
