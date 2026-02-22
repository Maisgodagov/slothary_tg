import { Volume2 } from 'lucide-react';

import { Button } from '../../../../shared/ui/Button';
import {
  Card,
  HeaderRow,
  HeaderTitle,
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
  optionButtonBaseStyle,
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
            <Button
              key={`${option}-${index}`}
              variant="ghost"
              onClick={() => onPickOption(option, isCorrectOption)}
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
      </OptionsGrid>
    </Card>
  );
}


