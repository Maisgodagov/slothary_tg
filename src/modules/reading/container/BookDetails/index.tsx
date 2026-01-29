import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../../../app/hooks";
import { selectAuth } from "../../../../features/auth/slice";
import { readingApi } from "../../../../features/reading/api";
import type { ReadingBook } from "../../../../features/reading/types";
import { resolveUserId } from "../../../../shared/lib/userId";
import { PageShell } from "../../../../shared/ui/PageShell";
import { Icon } from "../../../../shared/ui/Icon";
import { mockBooks } from "../../constants/mockBooks";
import * as S from "./styles";

type MockBook = ReadingBook & {
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
  const [book, setBook] = useState<MockBook | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = (await readingApi.getBook(id, userId)) as MockBook;
        setBook(data ?? null);
      } catch (err: any) {
        setError(err?.message ?? "Не удалось загрузить книгу.");
        setBook((mockBooks as MockBook[]).find((item) => item.id === id) ?? null);
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
              {book.level ? <S.LevelTag>{book.level} INTERMEDIATE</S.LevelTag> : null}
              <S.Title>{book.title}</S.Title>
              <S.Subtitle>{book.author ?? "Без автора"}</S.Subtitle>
              <S.StatsRow>
                <S.StatCard>
                  <S.StatValue>{book.minutes ?? 20} мин</S.StatValue>
                  <S.StatLabel>Время</S.StatLabel>
                </S.StatCard>
                <S.StatCard>
                  <S.StatValue>{book.wordCount ? book.wordCount.toLocaleString("ru-RU") : "47,000"}</S.StatValue>
                  <S.StatLabel>Слов</S.StatLabel>
                </S.StatCard>
                <S.StatCard>
                  <S.StatValue>{book.difficulty ?? "Средняя"}</S.StatValue>
                  <S.StatLabel>Сложность</S.StatLabel>
                </S.StatCard>
              </S.StatsRow>
              {book.progress ? <S.Progress>{formatProgress(book.progress)}</S.Progress> : null}
            </S.InfoCard>

            <S.AboutCard>
              <S.SectionTitle>О книге</S.SectionTitle>
              <S.Description>
                {book.description ??
                  "В этой классической истории вы найдете живые эмоции, сильных персонажей и незабываемую атмосферу."}
              </S.Description>
              <S.ReaderRow>
                <S.ReaderAvatars>
                  <S.Avatar />
                  <S.Avatar />
                  <S.Avatar />
                </S.ReaderAvatars>
                <S.ReaderMeta>+{book.readers ?? 1200} читают</S.ReaderMeta>
                <S.Rating>? {book.rating ?? 4.8}</S.Rating>
              </S.ReaderRow>
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

