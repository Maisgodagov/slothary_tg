import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../../../app/hooks";
import { selectAuth } from "../../../../features/auth/slice";
import { readingApi } from "../../../../features/reading/api";
import type { ReadingBook } from "../../../../features/reading/types";
import { resolveUserId } from "../../../../shared/lib/userId";
import { PageShell } from "../../../../shared/ui/PageShell";
import { Icon } from "../../../../shared/ui/Icon";
import * as S from "./styles";

type ReadingBookMeta = ReadingBook & {
  level?: string;
  minutes?: number;
  difficulty?: string;
  readers?: number;
  rating?: number;
};

const formatProgress = (progress?: ReadingBook["progress"]) => {
  if (!progress) return "";
  const percent = Math.round((progress.progress ?? 0) * 100);
  return percent ? `Прочитано ${percent}%` : "Не начато";
};

export function BookDetailsContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAppSelector(selectAuth);
  const userId = useMemo(() => resolveUserId(auth.profile?.id), [auth.profile?.id]);
  const [book, setBook] = useState<ReadingBookMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = (await readingApi.getBook(id, userId)) as ReadingBookMeta;
        setBook(data ?? null);
      } catch (err: any) {
        setError(err?.message ?? "Не удалось загрузить книгу.");
        setBook(null);
      }
    };
    load();
  }, [id, userId]);

  const handleRead = () => {
    if (!id) return;
    navigate(`/reading/${id}/read`);
  };

  const handleToggleShelf = async () => {
    if (!book || !id) return;
    try {
      if (book.inShelf) {
        await readingApi.removeFromShelf(userId, id);
        setBook({ ...book, inShelf: false });
      } else {
        await readingApi.addToShelf(userId, id);
        setBook({ ...book, inShelf: true });
      }
    } catch (err: any) {
      setError(err?.message ?? "Не удалось обновить полку.");
    }
  };

  return (
    <PageShell withNav={false}>
      <S.DetailWrapper>
        <S.Header>
          <S.BackButton onClick={() => navigate(-1)}>
            <Icon name="back" size={18} />
          </S.BackButton>
          <S.HeaderTitle>Чтение</S.HeaderTitle>
          <S.IconButton>
            <Icon name="bookmark" size={18} />
          </S.IconButton>
        </S.Header>

        {error && <S.Card>{error}</S.Card>}

        {book && (
          <>
            <S.Hero>
              <S.HeroCover $url={book.coverUrl} />
            </S.Hero>
            <S.InfoCard>
              {book.level ? <S.LevelTag>{book.level}</S.LevelTag> : null}
              <S.Title>{book.title}</S.Title>
              <S.Subtitle>{book.author ?? "Без автора"}</S.Subtitle>
              {(book.minutes || book.wordCount || book.difficulty) && (
                <S.StatsRow>
                  {book.minutes ? (
                    <S.StatCard>
                      <S.StatValue>{book.minutes} мин</S.StatValue>
                      <S.StatLabel>Время</S.StatLabel>
                    </S.StatCard>
                  ) : null}
                  {book.wordCount ? (
                    <S.StatCard>
                      <S.StatValue>{book.wordCount.toLocaleString("ru-RU")}</S.StatValue>
                      <S.StatLabel>Слов</S.StatLabel>
                    </S.StatCard>
                  ) : null}
                  {book.difficulty ? (
                    <S.StatCard>
                      <S.StatValue>{book.difficulty}</S.StatValue>
                      <S.StatLabel>Сложность</S.StatLabel>
                    </S.StatCard>
                  ) : null}
                </S.StatsRow>
              )}
              {book.progress ? <S.Progress>{formatProgress(book.progress)}</S.Progress> : null}
            </S.InfoCard>

            <S.AboutCard>
              <S.SectionTitle>О книге</S.SectionTitle>
              {book.description ? <S.Description>{book.description}</S.Description> : null}
              {(book.readers || book.rating) && (
                <S.ReaderRow>
                  <S.ReaderAvatars>
                    <S.Avatar />
                    <S.Avatar />
                    <S.Avatar />
                  </S.ReaderAvatars>
                  {book.readers ? <S.ReaderMeta>+{book.readers} читают</S.ReaderMeta> : null}
                  {book.rating ? <S.Rating>★ {book.rating}</S.Rating> : null}
                </S.ReaderRow>
              )}
              <S.Actions>
                <S.Button $primary onClick={handleRead}>
                  Читать
                </S.Button>
                <S.Button onClick={handleToggleShelf}>
                  {book.inShelf ? "Убрать с полки" : "На полку"}
                </S.Button>
              </S.Actions>
            </S.AboutCard>
          </>
        )}
      </S.DetailWrapper>
    </PageShell>
  );
}

