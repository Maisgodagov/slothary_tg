import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { selectAuth } from "../../../../features/auth/slice";
import { dictionaryApi } from "../../../../features/dictionary/api";
import { addWord, selectDictionary } from "../../../../features/dictionary/slice";
import { muellerApi, type MuellerEntry } from "../../../../features/mueller/api";
import { readingApi } from "../../../../features/reading/api";
import type { ReadingBook } from "../../../../features/reading/types";
import { resolveUserId } from "../../../../shared/lib/userId";
import { Icon } from "../../../../shared/ui/Icon";
import { WordCard } from "../../../../features/dictionary/components/WordCard";
import { PageShell } from "../../../../shared/ui/PageShell";
import { mockBooks } from "../../constants/mockBooks";
import * as S from "./styles";

const MOCK_TEXT = `Chapter 1\n\nIn my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.\n\n“Whenever you feel like criticizing anyone,” he told me, “just remember that all the people in this world haven't had the advantages that you've had.”\n\nHe didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.`;

export function ReaderContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAppSelector(selectAuth);
  const dictionary = useAppSelector(selectDictionary);
  const dispatch = useAppDispatch();
  const userId = useMemo(() => resolveUserId(auth.profile?.id), [auth.profile?.id]);
  const [book, setBook] = useState<ReadingBook | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [progress, setProgress] = useState<{ position: number; progress: number } | null>(
    null
  );
  const [lookup, setLookup] = useState<{
    word: string;
    status: "idle" | "loading" | "ready" | "error";
    entry?: MuellerEntry;
    error?: string;
  } | null>(null);
  const [popover, setPopover] = useState<{
    top: number;
    left: number;
    width: number;
    placement: "top" | "bottom";
  } | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const fontSaveTimeoutRef = useRef<number | null>(null);

  const fetchBook = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [bookData, pref, progressData] = await Promise.all([
        readingApi.getBook(id, userId),
        readingApi.getPreferences(userId),
        readingApi.getProgress(userId, id),
      ]);
      setBook(bookData);
      setFontSize(pref.readerFontSize ?? 18);
      if (progressData) {
        setProgress({ position: progressData.position, progress: progressData.progress });
      }
      if (bookData.fileUrl) {
        try {
          const response = await fetch(bookData.fileUrl);
          const fileText = await response.text();
          setText(fileText);
        } catch {
          setText(MOCK_TEXT);
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Не удалось загрузить книгу.");
      const fallback = (mockBooks as ReadingBook[]).find((item) => item.id === id) ?? null;
      setBook(fallback);
      setText(MOCK_TEXT);
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  useEffect(() => {
    if (!popover) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-reading-popover]")) return;
      setPopover(null);
      setLookup(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [popover]);

  useEffect(() => {
    if (!text || !contentRef.current) return;
    if (!progress?.position) return;
    contentRef.current.scrollTop = progress.position;
  }, [text, progress?.position]);

  useEffect(() => {
    if (!contentRef.current || !progress?.progress) return;
    const container = contentRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll <= 0) return;
    container.scrollTop = maxScroll * progress.progress;
  }, [fontSize]);

  const updateProgress = useCallback(
    (position: number, ratio: number) => {
      if (!id) return;
      setProgress({ position, progress: ratio });
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        readingApi
          .updateProgress(userId, { bookId: id, position, progress: ratio })
          .catch(() => null);
      }, 700);
    },
    [id, userId]
  );

  const handleScroll = useCallback(() => {
    const container = contentRef.current;
    if (!container) return;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const ratio = maxScroll > 0 ? container.scrollTop / maxScroll : 0;
    updateProgress(container.scrollTop, ratio);
  }, [updateProgress]);

  const handleFontChange = async (next: number) => {
    setFontSize(next);
    if (fontSaveTimeoutRef.current) {
      window.clearTimeout(fontSaveTimeoutRef.current);
    }
    fontSaveTimeoutRef.current = window.setTimeout(() => {
      readingApi.updatePreferences(userId, { readerFontSize: next }).catch(() => null);
    }, 500);
  };

  const englishParagraphs = useMemo(() => {
    if (!text) return [];
    return text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [text]);

  const handleWordClick = async (word: string, rect: DOMRect) => {
    const normalized = word.toLowerCase();
    if (!normalized) return;
    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    const popoverWidth = Math.min(280, viewportWidth * 0.88);
    const margin = 12;
    const centeredLeft = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      viewportWidth - margin - popoverWidth / 2,
      Math.max(margin + popoverWidth / 2, centeredLeft)
    );
    const estimatedHeight = 220;
    let placement: "top" | "bottom" = "top";
    if (rect.top < estimatedHeight + margin) placement = "bottom";
    if (placement === "bottom" && rect.bottom + estimatedHeight + margin > viewportHeight) {
      placement = "top";
    }
    const top = placement === "top" ? rect.top - 8 : rect.bottom + 8;
    setPopover({ top, left: clampedLeft, width: popoverWidth, placement });
    setLookup({ word: normalized, status: "loading" });
    try {
      const entries = await muellerApi.lookup({ word: normalized, lang: "en" });
      setLookup({ word: normalized, status: "ready", entry: entries[0] });
      const primary = entries[0];
      if (primary?.word && primary.translations?.[0]) {
        dictionaryApi
          .recordView(userId, {
            query: normalized,
            lang: "en",
            word: primary.word,
            translation: primary.translations[0],
          })
          .catch(() => null);
      }
    } catch (err: any) {
      setLookup({
        word: normalized,
        status: "error",
        error: err?.message ?? "Не удалось загрузить перевод.",
      });
    }
  };

  const renderParagraph = (paragraph: string, idx: number) => {
    const parts = paragraph.match(/([A-Za-z']+|[^A-Za-z']+)/g) ?? [paragraph];
    return (
      <S.Paragraph key={`p-${idx}`} style={{ fontSize }}>
        {parts.map((part, index) => {
          const isWord = /^[A-Za-z']+$/.test(part);
          if (!isWord) {
            return <span key={`${idx}-${index}`}>{part}</span>;
          }
          return (
            <S.Word
              key={`${idx}-${index}`}
              onClick={(event) => {
                const rect = (event.target as HTMLElement).getBoundingClientRect();
                handleWordClick(part, rect);
              }}
            >
              {part}
            </S.Word>
          );
        })}
      </S.Paragraph>
    );
  };

  const lookupEntry = lookup?.entry;
  const lookupInDictionary = Boolean(
    lookupEntry &&
      dictionary.items.find(
        (item) =>
          item.word.toLowerCase() === lookupEntry.word.toLowerCase() &&
          item.translation.toLowerCase() ===
            (lookupEntry.translations?.[0] ?? "").toLowerCase()
      )
  );

  const progressPercent = Math.round((progress?.progress ?? 0) * 100);

  if (loading)
    return (
      <PageShell withNav={false} scroll={false} pullToRefresh={false}>
        <S.Loader>Загружаем книгу...</S.Loader>
      </PageShell>
    );
  if (error)
    return (
      <PageShell withNav={false} scroll={false} pullToRefresh={false}>
        <S.Error>{error}</S.Error>
      </PageShell>
    );

  return (
    <PageShell withNav={false} scroll={false} pullToRefresh={false}>
      <S.ReaderShell>
        <S.ReaderHeader>
          <S.BackButton onClick={() => navigate(-1)}>
            <Icon name="back" size={18} />
          </S.BackButton>
          <S.HeaderTitle>{book?.title ?? "THE GREAT GATSBY"}</S.HeaderTitle>
          <S.FontButton>
            <span>Tt</span>
          </S.FontButton>
        </S.ReaderHeader>

        <S.ReaderProgress>
          <S.ProgressBar>
            <span style={{ width: `${progressPercent}%` }} />
          </S.ProgressBar>
          <S.ProgressText>{progressPercent}%</S.ProgressText>
        </S.ReaderProgress>

        <S.ReaderBody ref={contentRef} onScroll={handleScroll}>
          {englishParagraphs.map(renderParagraph)}
        </S.ReaderBody>

        <S.ReaderFooter>
          <S.FooterButton>
            <Icon name="back" size={14} />
            Предыдущая
          </S.FooterButton>
          <S.PageIndicator>
            стр. {Math.max(1, Math.round((progress?.progress ?? 0) * 124))} из 124
          </S.PageIndicator>
          <S.FooterButton>
            Следующая
            <Icon name="chevron-down" size={14} style={{ transform: "rotate(-90deg)" }} />
          </S.FooterButton>
        </S.ReaderFooter>

        {popover && (
          <S.Popover
            data-reading-popover
            $top={popover.top}
            $left={popover.left}
            $width={popover.width}
            $placement={popover.placement}
          >
            {lookup?.status === "loading" && <div>Ищем перевод...</div>}
            {lookup?.status === "error" && <div>{lookup.error}</div>}
            {lookup?.status === "ready" && lookupEntry && (
              <>
                <WordCard
                  word={lookupEntry.word}
                  translation={lookupEntry.translations?.[0] ?? ""}
                  size="subtitle"
                  showExamplesButton={false}
                  examplesOpen={false}
                  onToggleExamples={() => null}
                  dictionaryActionMode="none"
                />
                <S.PopoverActions>
                  <S.PopoverButton
                    $primary
                    disabled={lookupInDictionary}
                    onClick={() => {
                      if (!lookupEntry?.word || !lookupEntry.translations?.[0]) return;
                      if (lookupInDictionary) return;
                      dispatch(
                        addWord({
                          query: lookupEntry.word,
                          lang: "en",
                          word: lookupEntry.word,
                          translation: lookupEntry.translations[0],
                        })
                      );
                    }}
                  >
                    {lookupInDictionary ? "В словаре" : "В словарь"}
                  </S.PopoverButton>
                  <S.PopoverButton onClick={() => setPopover(null)}>Закрыть</S.PopoverButton>
                </S.PopoverActions>
              </>
            )}
          </S.Popover>
        )}

        <S.FontPanel>
          <S.FontLabel>Размер</S.FontLabel>
          <S.Range
            type="range"
            min={12}
            max={28}
            value={fontSize}
            onChange={(e) => handleFontChange(Number(e.target.value))}
          />
        </S.FontPanel>
      </S.ReaderShell>
    </PageShell>
  );
}

