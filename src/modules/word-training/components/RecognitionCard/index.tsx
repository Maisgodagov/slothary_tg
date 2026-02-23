import { Volume2 } from 'lucide-react';

import {
  Card,
  HeaderRow,
  HeaderTitle,
  OptionButton,
  OptionsGrid,
  PronButton,
  WordRow,
  WordText,
} from './styles';
import type { RecognitionCardProps } from './types';

export function RecognitionCard({
  recognition,
  submitting,
  recognitionChecked,
  recognitionWrongOption,
  onPlayPronunciation,
  onPickOption,
  normalize,
}: RecognitionCardProps) {
  const options: string[] =
    recognition.recognitionOptions?.length > 0
      ? recognition.recognitionOptions
      : [recognition.translation];

  return (
    <Card className="section">
      <HeaderRow>
        <HeaderTitle>Выбери правильный перевод</HeaderTitle>
      </HeaderRow>

      <WordRow>
        <WordText>{recognition.word}</WordText>
        <PronButton
          type="button"
          onClick={() => onPlayPronunciation(recognition)}
          disabled={!recognition.pronunciationAudioUrl}
          aria-label="Проиграть произношение"
          $enabled={Boolean(recognition.pronunciationAudioUrl)}
        >
          <Volume2 size={19} />
        </PronButton>
      </WordRow>

      <OptionsGrid>
        {options.map((option, index) => {
          const isCorrectOption = normalize(option) === normalize(recognition.translation);
          const showCorrect = recognitionChecked && isCorrectOption;
          const showWrong = normalize(recognitionWrongOption ?? '') === normalize(option);
          return (
            <OptionButton
              key={`${option}-${index}`}
              variant="ghost"
              onClick={() => onPickOption(option, isCorrectOption)}
              disabled={submitting || recognitionChecked}
              className={showWrong ? 'slot-shake' : undefined}
              $correct={showCorrect}
              $wrong={showWrong}
              style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}
            >
              {option}
            </OptionButton>
          );
        })}
      </OptionsGrid>
    </Card>
  );
}
