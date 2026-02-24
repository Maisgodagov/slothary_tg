import { Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SnippetCarousel } from '../../../../modules/dictionary/components/SnippetCarousel';
import {
  Card,
  Dash,
  HeaderRow,
  HeaderTitle,
  OtherText,
  OtherWrap,
  PronButton,
  Subtle,
  TranslationText,
  WordRow,
  WordText,
} from './styles';
import type { NewWordIntroCardProps } from './types';

export function NewWordIntroCard({
  introWord,
  snippets,
  snippetsLoading,
  onPlayAudio,
}: NewWordIntroCardProps) {
  const [examplesStarted, setExamplesStarted] = useState(false);

  useEffect(() => {
    setExamplesStarted(false);
  }, [introWord.wordKey]);

  const otherTranslations = (introWord.otherTranslations ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  return (
    <Card className="section">
      <HeaderRow>
        <HeaderTitle />
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
          <Volume2 size={18} />
        </PronButton>
      </WordRow>

      {otherTranslations.length ? (
        <OtherWrap>
          <OtherText>{otherTranslations.join(', ')}</OtherText>
        </OtherWrap>
      ) : null}

      {snippetsLoading ? (
        <Subtle>Загрузка примеров...</Subtle>
      ) : snippets.length ? (
        <SnippetCarousel
          items={snippets}
          highlight={introWord.word}
          showFullVideoButton={false}
          autoPlayActive={examplesStarted}
          initialPlayLabel={examplesStarted ? null : 'Примеры использования'}
          onFirstManualPlay={() => setExamplesStarted(true)}
          total={snippets.length}
          hasMore={false}
          isLoadingMore={false}
          onOpenFullVideo={(snippet) => {
            window.location.href = `/video?contentId=${encodeURIComponent(snippet.contentId)}&focus=${Date.now()}`;
          }}
        />
      ) : (
        <Subtle>Примеры пока не найдены.</Subtle>
      )}
    </Card>
  );
}

export default NewWordIntroCard;
