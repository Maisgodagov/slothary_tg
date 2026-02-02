import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../app/hooks";
import { selectAuth } from "../../../../features/auth/slice";
import { readingApi } from "../../../../features/reading/api";
import type { ReadingBook } from "../../../../features/reading/types";
import { PageShell } from "../../../../shared/ui/PageShell";
import { resolveUserId } from "../../../../shared/lib/userId";
import { Icon } from "../../../../shared/ui/Icon";
import { UploadModal } from "../../components/UploadModal";
import * as S from "./styles";

type TabKey = "library" | "shelf";

type ReadingBookMeta = ReadingBook & {
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
  const [books, setBooks] = useState<ReadingBookMeta[]>([]);
  const [shelf, setShelf] = useState<ReadingBookMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [shelfLoading, setShelfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = auth.profile?.role === "admin";

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readingApi.listBooks(userId);
      const items = (data.items ?? []) as ReadingBookMeta[];
      setBooks(items);
    } catch (err: any) {
      setError(err?.message ?? "Не удалось загрузить книги.");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadShelf = useCallback(async () => {
    setShelfLoading(true);
    setError(null);
    try {
      const data = await readingApi.getShelf(userId);
      const items = (data.items ?? []) as ReadingBookMeta[];
      setShelf(items);
    } catch (err: any) {
      setError(err?.message ?? "Не удалось загрузить полку.");
      setShelf([]);
    } finally {
      setShelfLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (!userId) return;
    loadShelf();
  }, [userId, loadShelf]);

  useEffect(() => {
    if (tab === "shelf") {
      loadShelf();
    }
  }, [tab, loadShelf]);

  const handleOpen = (bookId: string) => {
    navigate(`/reading/${bookId}`);
  };

  const handleUpload = async (payload: { file: File; cefrLevel?: string | null }) => {
    await readingApi.uploadBook(payload, userId, auth.profile?.role ?? null);
    await loadBooks();
  };

  const hasCategories = books.some((book) => book.category);
  const beginnerBooks = hasCategories
    ? books.filter((book) => book.category === "Для начинающих")
    : books;
  const classicBooks = hasCategories
    ? books.filter((book) => book.category === "Классика")
    : [];

  const renderShelf = (items: ReadingBookMeta[]) => {
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

  const renderCards = (items: ReadingBookMeta[]) => {
    if (!items.length && !loading && !shelfLoading) {
      return <S.EmptyState>Пока здесь пусто.</S.EmptyState>;
    }
    return (
      <S.Grid>
        {items.map((book) => (
          <S.GridCard key={book.id} onClick={() => handleOpen(book.id)}>
            <S.GridCover $url={book.coverUrl}>
              {book.level ? <S.LevelTag>{book.level}</S.LevelTag> : null}
            </S.GridCover>
            <S.GridTitle>{book.title}</S.GridTitle>
            <S.GridAuthor>{book.author ?? "Без автора"}</S.GridAuthor>
          </S.GridCard>
        ))}
      </S.Grid>
    );
  };

  return (
    <PageShell>
      <S.ReadingWrapper>
        <S.TopBar>
          <div />
          <S.TopTitle>Чтение</S.TopTitle>
          {isAdmin ? (
            <S.IconButton onClick={() => setUploadOpen(true)}>
              <Icon name="edit" size={18} />
            </S.IconButton>
          ) : (
            <S.IconButton>
              <Icon name="search" size={18} />
            </S.IconButton>
          )}
        </S.TopBar>

        <S.SectionHeader>
          <div>Моя полка</div>
          <S.SectionLink onClick={() => setTab("shelf")}>Все</S.SectionLink>
        </S.SectionHeader>
        {renderShelf(shelf)}

        {beginnerBooks.length > 0 && (
          <>
            <S.SectionHeader>
              <div>Для начинающих</div>
              <S.SectionLink>Смотреть все</S.SectionLink>
            </S.SectionHeader>
            {renderCards(beginnerBooks)}
          </>
        )}

        {classicBooks.length > 0 && (
          <>
            <S.SectionHeader>
              <div>Классика</div>
              <S.SectionLink>Смотреть все</S.SectionLink>
            </S.SectionHeader>
            {renderCards(classicBooks)}
          </>
        )}

        {isAdmin && error && <S.EmptyState>{error}</S.EmptyState>}
      </S.ReadingWrapper>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
      />
    </PageShell>
  );
}

export default ReadingContainer;


