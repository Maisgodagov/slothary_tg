import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../app/hooks";
import { selectAuth } from "../../../../features/auth/slice";
import { readingApi } from "../../../../features/reading/api";
import type { ReadingBook } from "../../../../features/reading/types";
import { PageShell } from "../../../../shared/ui/PageShell";
import { resolveUserId } from "../../../../shared/lib/userId";
import { Icon } from "../../../../shared/ui/Icon";
import { mockBooks } from "../../constants/mockBooks";
import * as S from "./styles";

type TabKey = "library" | "shelf";

type MockBook = ReadingBook & {
  level?: string;
  minutes?: number;
  difficulty?: string;
  category?: string;
  readers?: number;
  rating?: number;
};

export function ReadingContainer() {
  const auth = useAppSelector(selectAuth);
  const userId = useMemo(() => resolveUserId(auth.profile?.id), [auth.profile?.id]);
  const [tab, setTab] = useState<TabKey>("library");
  const [books, setBooks] = useState<MockBook[]>([]);
  const [shelf, setShelf] = useState<MockBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [shelfLoading, setShelfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAdmin = auth.profile?.role === "admin";

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readingApi.listBooks(userId);
      const items = (data.items ?? []) as MockBook[];
      setBooks(items.length ? items : (mockBooks as MockBook[]));
    } catch (err: any) {
      setError(err?.message ?? "Не удалось загрузить книги.");
      setBooks(mockBooks as MockBook[]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadShelf = useCallback(async () => {
    setShelfLoading(true);
    setError(null);
    try {
      const data = await readingApi.getShelf(userId);
      const items = (data.items ?? []) as MockBook[];
      setShelf(items.length ? items : (mockBooks as MockBook[]).filter((book) => book.inShelf));
    } catch (err: any) {
      setError(err?.message ?? "Не удалось загрузить полку.");
      setShelf((mockBooks as MockBook[]).filter((book) => book.inShelf));
    } finally {
      setShelfLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (tab === "shelf") {
      loadShelf();
    }
  }, [tab, loadShelf]);

  const handleOpen = (bookId: string) => {
    navigate(`/reading/${bookId}`);
  };

  const beginnerBooks = books.filter((book) => book.category === "Для начинающих");
  const classicBooks = books.filter((book) => book.category === "Классика");

  const renderShelf = (items: MockBook[]) => {
    if (!items.length && !loading && !shelfLoading) {
      return <S.EmptyState>Пока здесь пусто.</S.EmptyState>;
    }
    return (
      <S.ShelfRow>
        {items.map((book) => (
          <S.ShelfCard key={book.id} onClick={() => handleOpen(book.id)}>
            <S.ShelfCover $url={book.coverUrl}>
              {book.progress ? (
                <S.ShelfProgress>{Math.round((book.progress.progress ?? 0) * 100)}%</S.ShelfProgress>
              ) : null}
            </S.ShelfCover>
            <S.ShelfTitle>{book.title}</S.ShelfTitle>
          </S.ShelfCard>
        ))}
      </S.ShelfRow>
    );
  };

  const renderCards = (items: MockBook[]) => {
    if (!items.length && !loading && !shelfLoading) {
      return <S.EmptyState>Пока здесь пусто.</S.EmptyState>;
    }
    return (
      <S.List>
        {items.map((book) => (
          <S.ListCard key={book.id} onClick={() => handleOpen(book.id)}>
            <S.ListCover $url={book.coverUrl} />
            <S.ListBody>
              <S.ListTitle>{book.title}</S.ListTitle>
              <S.ListMeta>{book.author ?? "Без автора"}</S.ListMeta>
              <S.ListMeta>
                <span>{book.minutes ? `${book.minutes} мин` : ""}</span>
                <span>{book.wordCount ? `${book.wordCount.toLocaleString("ru-RU")} слов` : ""}</span>
              </S.ListMeta>
            </S.ListBody>
            {book.level ? <S.LevelTag>{book.level}</S.LevelTag> : null}
          </S.ListCard>
        ))}
      </S.List>
    );
  };

  return (
    <PageShell>
      <S.ReadingWrapper>
        <S.TopBar>
          <S.BackButton onClick={() => navigate(-1)}>
            <Icon name="back" size={18} />
          </S.BackButton>
          <S.TopTitle>Чтение</S.TopTitle>
          <S.IconButton>
            <Icon name="search" size={18} />
          </S.IconButton>
        </S.TopBar>

        <S.SectionHeader>
          <div>Моя полка</div>
          <S.SectionLink onClick={() => setTab("shelf")}>Все</S.SectionLink>
        </S.SectionHeader>
        {renderShelf(shelf.length ? shelf : (mockBooks as MockBook[]).filter((b) => b.inShelf))}

        <S.SectionHeader>
          <div>Для начинающих</div>
          <S.SectionLink>Смотреть все</S.SectionLink>
        </S.SectionHeader>
        {renderCards(beginnerBooks.length ? beginnerBooks : (mockBooks as MockBook[]).filter((b) => b.category === "Для начинающих"))}

        <S.SectionHeader>
          <div>Классика</div>
          <S.SectionLink>Смотреть все</S.SectionLink>
        </S.SectionHeader>
        {renderCards(classicBooks.length ? classicBooks : (mockBooks as MockBook[]).filter((b) => b.category === "Классика"))}

        {isAdmin && error && <S.EmptyState>{error}</S.EmptyState>}
      </S.ReadingWrapper>
    </PageShell>
  );
}

export default ReadingContainer;


