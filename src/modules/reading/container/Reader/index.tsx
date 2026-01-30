import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import * as S from "./styles";

export function ReaderContainer() {
  const CHAPTER_BREAK = "__CHAPTER_BREAK__";
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
  const [pages, setPages] = useState<string[][]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [fontOpen, setFontOpen] = useState(false);
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
  const initialPageRef = useRef(false);

  const withCacheBust = useCallback((url: string) => {
    const stamp = Date.now();
    return url.includes("?") ? `${url}&v=${stamp}` : `${url}?v=${stamp}`;
  }, []);

  const fetchBook = useCallback(async () => {
    if (!id) return;
    initialPageRef.current = false;
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
        if (bookData.fileUrl.endsWith(".json")) {
          const manifest = await fetch(withCacheBust(bookData.fileUrl)).then((res) =>
            res.json(),
          );
          if (manifest?.chapters?.length) {
            const chapterFiles = manifest.chapters.map((chapter: any) => chapter.file);
            const base = bookData.fileUrl.replace("/book.json", "");
            const totalWords = manifest.chapters.reduce(
              (sum: number, chapter: any) => sum + (chapter?.wordCount ?? 0),
              0,
            );
            let initialIndex = 0;
            if (totalWords > 0 && typeof progressData?.progress === "number") {
              const targetWord = totalWords * Math.min(Math.max(progressData.progress, 0), 1);
              let acc = 0;
              for (let i = 0; i < manifest.chapters.length; i += 1) {
                acc += manifest.chapters[i]?.wordCount ?? 0;
                if (acc >= targetWord) {
                  initialIndex = i;
                  break;
                }
              }
            }

            const initialFile = chapterFiles[initialIndex];
            if (initialFile) {
              const initialUrl = withCacheBust(`${base}/${initialFile.replace(/^\/+/, "")}`);
              const initialChapter = await fetch(initialUrl).then((res) => res.json());
              const initialTitle = initialChapter?.title ? [`${initialChapter.title}`] : [];
              const initialParagraphs = Array.isArray(initialChapter?.paragraphs)
                ? initialChapter.paragraphs
                : [];
              setText([...initialTitle, ...initialParagraphs, ""].join("\n\n"));
              setLoading(false);
            }

            const loadAllChapters = async () => {
              const chapters: any[] = new Array(chapterFiles.length);
              if (initialFile) {
                chapters[initialIndex] = await fetch(
                  withCacheBust(`${base}/${initialFile.replace(/^\/+/, "")}`),
                ).then((res) => res.json());
              }
              for (let i = 0; i < chapterFiles.length; i += 1) {
                if (i === initialIndex) continue;
                const file = chapterFiles[i];
                const url = withCacheBust(`${base}/${file.replace(/^\/+/, "")}`);
                chapters[i] = await fetch(url).then((res) => res.json());
              }
              const merged = chapters.flatMap((chapter: any, index: number) => {
                const title = chapter?.title ? [`${chapter.title}`] : [];
                const paragraphs = Array.isArray(chapter?.paragraphs) ? chapter.paragraphs : [];
                const breakMarker = index < chapters.length - 1 ? [CHAPTER_BREAK] : [];
                return [...title, ...paragraphs, "", ...breakMarker];
              });
              setText(merged.join("\n\n"));
            };

            loadAllChapters().catch(() => null);
          } else if (Array.isArray(manifest?.paragraphs)) {
            setText(manifest.paragraphs.join("\n\n"));
          } else {
            setText("");
          }
        } else {
          const response = await fetch(withCacheBust(bookData.fileUrl));
          const fileText = await response.text();
          setText(fileText);
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Не удалось загрузить книгу.");
      setBook(null);
      setText("");
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
      if (target.closest("[data-reading-word]")) return;
      setPopover(null);
      setLookup(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [popover]);

  useEffect(() => {
    if (!fontOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-font-panel]")) return;
      if (target.closest("[data-font-toggle]")) return;
      setFontOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [fontOpen]);

  const englishParagraphs = useMemo(() => {
    if (!text) return [];
    return text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0 || p === CHAPTER_BREAK);
  }, [text]);

  useLayoutEffect(() => {
    const container = contentRef.current;
    if (!container || englishParagraphs.length === 0) {
      setPages([]);
      setCurrentPage(0);
      return;
    }

    const maxHeight = container.clientHeight;
    const width = container.clientWidth;
    const measure = document.createElement("div");
    measure.style.position = "fixed";
    measure.style.visibility = "hidden";
    measure.style.pointerEvents = "none";
    measure.style.left = "-9999px";
    measure.style.top = "0";
    measure.style.width = `${width}px`;
    measure.style.padding = "0";
    measure.style.fontFamily =
      "Plus Jakarta Sans, SF Pro Display, Roboto, system-ui, -apple-system, sans-serif";
    document.body.appendChild(measure);

    const nextPages: string[][] = [];
    let current: string[] = [];
    let currentHeight = 0;

    for (const paragraph of englishParagraphs) {
      if (paragraph === CHAPTER_BREAK) {
        if (current.length > 0) nextPages.push(current);
        current = [];
        currentHeight = 0;
        continue;
      }
      const p = document.createElement("p");
      p.style.margin = "0 0 18px";
      p.style.lineHeight = "1.7";
      p.style.fontSize = `${fontSize}px`;
      p.style.whiteSpace = "normal";
      p.textContent = paragraph;
      measure.appendChild(p);
      const height = p.getBoundingClientRect().height;
      measure.removeChild(p);

      if (current.length === 0 || currentHeight + height <= maxHeight) {
        current.push(paragraph);
        currentHeight += height;
      } else {
        nextPages.push(current);
        current = [paragraph];
        currentHeight = height;
      }
    }
    if (current.length > 0) nextPages.push(current);

    document.body.removeChild(measure);

    setPages(nextPages);
    if (!initialPageRef.current && nextPages.length > 0) {
      const ratio = Math.min(Math.max(progress?.progress ?? 0, 0), 1);
      const initialIndex = Math.min(
        nextPages.length - 1,
        Math.floor(ratio * nextPages.length),
      );
      setCurrentPage(initialIndex);
      initialPageRef.current = true;
    } else {
      setCurrentPage((prev) => Math.min(prev, Math.max(nextPages.length - 1, 0)));
    }
  }, [englishParagraphs, fontSize, progress?.progress]);

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

  const goToPage = useCallback(
    (next: number) => {
      if (pages.length === 0) return;
      const clamped = Math.min(Math.max(next, 0), pages.length - 1);
      setCurrentPage(clamped);
      const ratio = pages.length > 1 ? clamped / (pages.length - 1) : 0;
      updateProgress(clamped, ratio);
    },
    [pages.length, updateProgress],
  );

  const handleFontChange = async (next: number) => {
    setFontSize(next);
    if (fontSaveTimeoutRef.current) {
      window.clearTimeout(fontSaveTimeoutRef.current);
    }
    fontSaveTimeoutRef.current = window.setTimeout(() => {
      readingApi.updatePreferences(userId, { readerFontSize: next }).catch(() => null);
    }, 500);
  };

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
              data-reading-word
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
          <S.FontButton data-font-toggle onClick={() => setFontOpen((prev) => !prev)}>
            <span>Tt</span>
          </S.FontButton>
        </S.ReaderHeader>

        <S.ReaderProgress>
          <S.ProgressBar>
            <span style={{ width: `${progressPercent}%` }} />
          </S.ProgressBar>
          <S.ProgressText>{progressPercent}%</S.ProgressText>
        </S.ReaderProgress>

        <S.ReaderBody ref={contentRef}>
          {(pages[currentPage] ?? []).map(renderParagraph)}
        </S.ReaderBody>

        <S.ReaderFooter>
          <S.FooterButton
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 0}
          >
            <Icon name="back" size={14} />
            Предыдущая
          </S.FooterButton>
          <S.PageIndicator>
            {currentPage + 1}/{pages.length || 1} · {progressPercent}%
          </S.PageIndicator>
          <S.FooterButton
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= (pages.length || 1) - 1}
          >
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

        {fontOpen && (
          <S.FontPanel data-font-panel>
            <S.FontLabel>Размер</S.FontLabel>
            <S.Range
              type="range"
              min={12}
              max={28}
              value={fontSize}
              onChange={(e) => handleFontChange(Number(e.target.value))}
            />
          </S.FontPanel>
        )}
      </S.ReaderShell>
    </PageShell>
  );
}





