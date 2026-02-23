import { CircleHelp, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { SnippetCarousel } from '../../../../modules/dictionary/components/SnippetCarousel';
import {
  Card,
  Dash,
  HeaderRow,
  HeaderTitle,
  InfoButton,
  InfoPopover,
  InfoWrap,
  KnowButton,
  KnowRow,
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
  onMarkKnown,
  disabled,
}: NewWordIntroCardProps) {
  const [showKnowHint, setShowKnowHint] = useState(false);
  const [examplesStarted, setExamplesStarted] = useState(false);
  const infoWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setExamplesStarted(false);
  }, [introWord.wordKey]);

  useEffect(() => {
    if (!showKnowHint) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (infoWrapRef.current?.contains(target)) return;
      setShowKnowHint(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showKnowHint]);

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

      <KnowRow>
        <KnowButton type="button" onClick={() => onMarkKnown(introWord.wordKey)} disabled={disabled}>
          Уже знаю это слово
        </KnowButton>
        <InfoWrap ref={infoWrapRef}>
          <InfoButton
            type="button"
            onClick={() => setShowKnowHint((prev) => !prev)}
            aria-label="Подсказка"
          >
            <CircleHelp size={16} />
          </InfoButton>
          {showKnowHint ? (
            <InfoPopover>
              Если отметить слово как знакомое, оно больше не будет попадаться в тренировках.
            </InfoPopover>
          ) : null}
        </InfoWrap>
      </KnowRow>

      {snippetsLoading ? (
        <Subtle>Загрузка примеров...</Subtle>
      ) : snippets.length ? (
        <SnippetCarousel
          items={snippets}
          highlight={introWord.word}
          showFullVideoButton={false}
          autoPlayActive={examplesStarted}
          initialPlayLabel={examplesStarted ? null : "Примеры использования"}
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
