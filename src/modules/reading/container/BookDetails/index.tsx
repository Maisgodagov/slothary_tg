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
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCefrLevel, setEditCefrLevel] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isAdmin = auth.profile?.role === "admin";

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = (await readingApi.getBook(id, userId)) as ReadingBookMeta;
        setBook(data ?? null);
        setEditTitle(data?.title ?? "");
        setEditAuthor(data?.author ?? "");
        setEditDescription(data?.description ?? "");
        setEditCefrLevel(data?.cefrLevel ?? "");
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

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await readingApi.updateBook(
        id,
        {
          title: editTitle.trim() || undefined,
          author: editAuthor.trim() ? editAuthor.trim() : null,
          description: editDescription.trim() ? editDescription.trim() : null,
          cefrLevel: editCefrLevel.trim() ? editCefrLevel.trim() : null,
        },
        userId,
        auth.profile?.role ?? null,
      );
      setBook(updated as ReadingBookMeta);
      setEditOpen(false);
    } catch (err: any) {
      setError(err?.message ?? "Не удалось сохранить изменения.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Удалить книгу? Это действие необратимо.")) return;
    setDeleting(true);
    setError(null);
    try {
      await readingApi.deleteBook(id, userId, auth.profile?.role ?? null);
      navigate("/reading");
    } catch (err: any) {
      setError(err?.message ?? "Не удалось удалить книгу.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageShell withNav={false}>
      <S.DetailWrapper>
        <S.Header>
          <div />
          <S.HeaderTitle>Чтение</S.HeaderTitle>
          <div />
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
              {(book.minutes || book.difficulty) && (
                <S.StatsRow>
                  {book.minutes ? (
                    <S.StatCard>
                      <S.StatValue>{book.minutes} мин</S.StatValue>
                      <S.StatLabel>Время</S.StatLabel>
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
              {book.cefrLevel ? <S.Progress>Уровень: {book.cefrLevel}</S.Progress> : null}
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

            {isAdmin && editOpen && (
              <S.EditModalBackdrop onClick={() => setEditOpen(false)}>
                <S.EditModalCard onClick={(event) => event.stopPropagation()}>
                  <S.SectionTitle>Редактировать книгу</S.SectionTitle>
                  <S.AdminLabel>
                    Название
                    <S.AdminInput value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  </S.AdminLabel>
                  <S.AdminLabel>
                    Автор
                    <S.AdminInput value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} />
                  </S.AdminLabel>
                  <S.AdminLabel>
                    Описание
                    <S.AdminTextarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </S.AdminLabel>
                  <S.AdminLabel>
                    Уровень CEFR
                    <S.AdminSelect
                      value={editCefrLevel}
                      onChange={(e) => setEditCefrLevel(e.target.value)}
                    >
                      <option value="">Не указан</option>
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                    </S.AdminSelect>
                  </S.AdminLabel>
                  <S.AdminActions>
                    <S.Button onClick={() => setEditOpen(false)} disabled={saving}>
                      Отмена
                    </S.Button>
                    <S.Button $primary onClick={handleSave} disabled={saving}>
                      {saving ? "Сохраняем..." : "Сохранить"}
                    </S.Button>
                  </S.AdminActions>
                </S.EditModalCard>
              </S.EditModalBackdrop>
            )}
          </>
        )}
      </S.DetailWrapper>

      {isAdmin && (
        <S.AdminTopActions>
          <S.IconAction onClick={() => setEditOpen(true)} aria-label="Редактировать книгу">
            <Icon name="edit" size={18} />
          </S.IconAction>
          <S.IconDanger onClick={handleDelete} disabled={deleting || saving} aria-label="Удалить книгу">
            <Icon name="close" size={18} />
          </S.IconDanger>
        </S.AdminTopActions>
      )}
    </PageShell>
  );
}

