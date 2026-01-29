import type { ReadingBook } from "../../../../features/reading/types";
import * as S from "./styles";

interface BookCardProps {
  book: ReadingBook;
  onOpen: (bookId: string) => void;
}

const formatProgress = (progress?: ReadingBook["progress"]) => {
  if (!progress) return "";
  const percent = Math.round((progress.progress ?? 0) * 100);
  return percent ? `Прочитано ${percent}%` : "Не начато";
};

export function BookCard({ book, onOpen }: BookCardProps) {
  return (
    <S.Card onClick={() => onOpen(book.id)}>
      <S.Cover $url={book.coverUrl} />
      <div>
        <S.Title>{book.title}</S.Title>
        <S.Meta>{book.author ?? "Без автора"}</S.Meta>
      </div>
      <S.Progress>{formatProgress(book.progress)}</S.Progress>
    </S.Card>
  );
}
