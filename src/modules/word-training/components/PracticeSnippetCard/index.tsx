import { SnippetCarousel } from '../../../../modules/dictionary/components/SnippetCarousel';
import type { PracticeSnippetCardProps } from './types';
import { Card, Highlight, Hint, Subtle, Title } from './styles';

export function PracticeSnippetCard({ word, snippets, loading }: PracticeSnippetCardProps) {
  return (
    <Card className="section">
      <Title>
        Послушай слово <Highlight>{word}</Highlight> в живой речи
      </Title>
      <Hint>Нажимай на субтитры, чтобы смотреть перевод незнакомых слов.</Hint>
      {loading ? (
        <Subtle>Загрузка примеров...</Subtle>
      ) : snippets.length ? (
        <SnippetCarousel
          items={snippets}
          highlight={word}
          showFullVideoButton={false}
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

export default PracticeSnippetCard;

