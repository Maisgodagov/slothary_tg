import { Volume2 } from 'lucide-react';

import {
  Card,
  CefrBadge,
  Dash,
  HeaderRow,
  HeaderTitle,
  OtherLabel,
  OtherText,
  OtherWrap,
  PronButton,
  TranslationText,
  WordRow,
  WordText,
} from './styles';
import type { NewWordIntroCardProps } from './types';

export function NewWordIntroCard({ introWord, onPlayAudio }: NewWordIntroCardProps) {
  const otherTranslations = (introWord.otherTranslations ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  return (
    <Card className="section">
      <HeaderRow>
        <HeaderTitle>Новое слово</HeaderTitle>
      </HeaderRow>

      <WordRow>
        <WordText>
          {introWord.word} <Dash>-</Dash> <TranslationText>{introWord.translation}</TranslationText>
        </WordText>
        <PronButton
          type="button"
          onClick={() => onPlayAudio(introWord.pronunciationAudioUrl ?? null)}
          disabled={!introWord.pronunciationAudioUrl}
          aria-label="Проиграть произношение"
          $enabled={Boolean(introWord.pronunciationAudioUrl)}
        >
          <Volume2 size={19} />
        </PronButton>
      </WordRow>

      {introWord.cefrLevel ? <CefrBadge>CEFR: {introWord.cefrLevel}</CefrBadge> : null}

      {otherTranslations.length ? (
        <OtherWrap>
          <OtherLabel>Другие переводы:</OtherLabel>
          <OtherText>{otherTranslations.join(', ')}</OtherText>
        </OtherWrap>
      ) : null}
    </Card>
  );
}



export default NewWordIntroCard;

