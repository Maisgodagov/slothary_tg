import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { initFb2File } from "@lingo-reader/fb2-parser";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { selectAuth } from "../../../../features/auth/slice";
import { dictionaryApi } from "../../../../features/dictionary/api";
import {
  addWord,
  selectDictionary,
} from "../../../../features/dictionary/slice";
import {
  muellerApi,
  type MuellerEntry,
} from "../../../../features/mueller/api";
import { readingApi } from "../../../../features/reading/api";
import type { ReadingBook } from "../../../../features/reading/types";
import { resolveUserId } from "../../../../shared/lib/userId";
import { WordCard } from "../../../../features/dictionary/components/WordCard";
import {
  videoDictionaryApi,
  type PhraseSnippet,
} from "../../../../features/video-dictionary/api";
import { SearchSnippetsCarousel } from "../../../dictionary/components/SearchSnippetsCarousel";
import { PageShell } from "../../../../shared/ui/PageShell";
import { Icon } from "../../../../shared/ui/Icon";
import * as S from "./styles";

export function ReaderContainer() {
  const CHAPTER_BREAK = "__CHAPTER_BREAK__";
  const BOOK_FOOTER =
    "Hope you have enjoyed the reading!\n\nCome back to http://english-e-books.net/ to find more fascinating and exciting stories!";
  const EXAMPLE_CARD_WIDTH = 260;
  const EXAMPLE_POPOVER_WIDTH = 320;
  const { id } = useParams();
  const auth = useAppSelector(selectAuth);
  const dictionary = useAppSelector(selectDictionary);
  const dispatch = useAppDispatch();
  const userId = useMemo(
    () => resolveUserId(auth.profile?.id),
    [auth.profile?.id],
  );
  const [book, setBook] = useState<ReadingBook | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [progress, setProgress] = useState<{
    position: number;
    progress: number;
  } | null>(null);
  const [pages, setPages] = useState<string[][]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [fontOpen, setFontOpen] = useState(false);
  const [layoutTick, setLayoutTick] = useState(0);
  const [lookup, setLookup] = useState<{
    word: string;
    status: "idle" | "loading" | "ready" | "error";
    entry?: MuellerEntry;
    error?: string;
  } | null>(null);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [snippetState, setSnippetState] = useState<{
    status: "idle" | "loading" | "ready" | "error";
    items: PhraseSnippet[];
    total: number;
    error?: string;
  }>({ status: "idle", items: [], total: 0 });
  const [activeSnippetIndex, setActiveSnippetIndex] = useState(0);
  const [popover, setPopover] = useState<{
    top: number;
    left: number;
    width: number;
    placement: "top" | "bottom";
  } | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const firstCardRef = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const fontSaveTimeoutRef = useRef<number | null>(null);
  const initialPageRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const withCacheBust = useCallback((url: string) => {
    const stamp = Date.now();
    return url.includes("?") ? `${url}&v=${stamp}` : `${url}?v=${stamp}`;
  }, []);

  const normalizeText = useCallback((value: string): string => {
    return value
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const extractParagraphsFromHtml = useCallback(
    (html: string): string[] => {
      const normalized = html.replace(/<br\s*\/?>(\s*)/gi, "\n");
      const doc = new DOMParser().parseFromString(normalized, "text/html");
      const paragraphs: string[] = [];

      doc.querySelectorAll("p").forEach((node) => {
        const text = normalizeText(node.textContent ?? "");
        if (text.length > 0) paragraphs.push(text);
      });

      if (paragraphs.length > 0) return paragraphs;

      const bodyText = normalizeText(doc.body?.textContent ?? "");
      if (!bodyText) return [];

      return bodyText
        .replace(/\r/g, "")
        .split(/\n{2,}/)
        .map((chunk) => normalizeText(chunk))
        .filter(Boolean);
    },
    [normalizeText],
  );

  const stripBookFooter = useCallback(
    (value: string): string => {
      const trimmed = value.replace(/\s+$/g, "");
      if (!trimmed.endsWith(BOOK_FOOTER)) return value;
      const withoutFooter = trimmed.slice(0, trimmed.length - BOOK_FOOTER.length);
      return withoutFooter.replace(/\s+$/g, "");
    },
    [BOOK_FOOTER],
  );

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
        setProgress({
          position: progressData.position,
          progress: progressData.progress,
        });
      }
      if (bookData.fileUrl) {
        if (bookData.fileUrl.endsWith(".fb2")) {
          const response = await fetch(withCacheBust(bookData.fileUrl));
          const buffer = await response.arrayBuffer();
          const blob = new Blob([buffer], { type: "application/xml" });
          const file =
            typeof File === "function"
              ? new File([blob], "book.fb2", { type: "application/xml" })
              : blob;
          const fb2 = await initFb2File(file as any);
          const spine = fb2.getSpine();
          const toc = fb2.getToc();
          const tocMap = new Map(
            toc.map((item) => [item.href.replace(/^fb2:/, ""), item.label])
          );
          const merged: string[] = [];
          for (let i = 0; i < spine.length; i += 1) {
            const entry = spine[i];
            const chapter = await fb2.loadChapter(entry.id);
            const titleLabel = tocMap.get(entry.id);
            const title = titleLabel ? [titleLabel] : [];
            const paragraphs = extractParagraphsFromHtml(chapter?.html ?? "");
            if (i > 0) {
              merged.push(CHAPTER_BREAK);
            }
            merged.push(...title, ...paragraphs, "");
          }
          setText(stripBookFooter(merged.join("\n\n")));
          if (typeof fb2.destroy === "function") {
            fb2.destroy();
          }
        } else {
          const response = await fetch(withCacheBust(bookData.fileUrl));
          const fileText = await response.text();
          setText(stripBookFooter(fileText));
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
    let cancelled = false;
    if (document?.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) setLayoutTick((prev) => prev + 1);
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const observed: Element[] = [];
    const observer = new ResizeObserver(() => {
      setLayoutTick((prev) => prev + 1);
    });
    if (contentRef.current) {
      observer.observe(contentRef.current);
      observed.push(contentRef.current);
    }
    if (footerRef.current) {
      observer.observe(footerRef.current);
      observed.push(footerRef.current);
    }
    return () => {
      observed.forEach((node) => observer.unobserve(node));
      observer.disconnect();
    };
  }, []);

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
    setExamplesOpen(false);
    setSnippetState({ status: "idle", items: [], total: 0 });
    setActiveSnippetIndex(0);
  }, [lookup?.word]);

  useEffect(() => {
    if (!popover) return;
    if (!examplesOpen) return;
    setPopover((prev) =>
      prev ? { ...prev, width: EXAMPLE_POPOVER_WIDTH } : prev,
    );
  }, [examplesOpen, popover]);

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
    const shell = shellRef.current;
    if (!container || !shell || englishParagraphs.length === 0) {
      setPages([]);
      setCurrentPage(0);
      return;
    }

    const styles = window.getComputedStyle(container);
    const padTop = parseFloat(styles.paddingTop || "0");
    const padBottom = parseFloat(styles.paddingBottom || "0");
    const padLeft = parseFloat(styles.paddingLeft || "0");
    const padRight = parseFloat(styles.paddingRight || "0");
    const footerHeight = footerRef.current?.getBoundingClientRect().height ?? 0;
    const safetyPadding = 62;
    const maxHeight = Math.max(
      0,
      shell.clientHeight - padTop - padBottom - footerHeight - safetyPadding,
    );
    const width = Math.max(0, container.clientWidth - padLeft - padRight);
    const paragraphSpacing = 18;

    if (!measureRef.current) {
      const node = document.createElement("div");
      node.style.position = "fixed";
      node.style.visibility = "hidden";
      node.style.pointerEvents = "none";
      node.style.left = "-9999px";
      node.style.top = "0";
      node.style.whiteSpace = "normal";
      node.style.wordBreak = "normal";
      node.style.overflowWrap = "break-word";
      document.body.appendChild(node);
      measureRef.current = node;
    }

    const measure = measureRef.current;
    measure.style.width = `${width}px`;
    measure.style.fontFamily =
      "Plus Jakarta Sans, SF Pro Display, Roboto, system-ui, -apple-system, sans-serif";
    measure.style.fontSize = `${fontSize}px`;
    measure.style.lineHeight = "1.7";

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

      measure.textContent = paragraph;
      const height = measure.getBoundingClientRect().height;
      const blockHeight = height + paragraphSpacing;

      if (current.length === 0 || currentHeight + blockHeight <= maxHeight) {
        current.push(paragraph);
        currentHeight += blockHeight;
      } else {
        nextPages.push(current);
        current = [paragraph];
        currentHeight = blockHeight;
      }
    }
    if (current.length > 0) nextPages.push(current);

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
      setCurrentPage((prev) =>
        Math.min(prev, Math.max(nextPages.length - 1, 0)),
      );
    }
  }, [englishParagraphs, fontSize, progress?.progress, layoutTick]);

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
    [id, userId],
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

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (startX === null || startY === null) return;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (popover) {
      setPopover(null);
      setLookup(null);
    }
    if (dx < 0) {
      goToPage(currentPage + 1);
    } else {
      goToPage(currentPage - 1);
    }
  };

  const handleFontChange = async (next: number) => {
    setFontSize(next);
    if (fontSaveTimeoutRef.current) {
      window.clearTimeout(fontSaveTimeoutRef.current);
    }
    fontSaveTimeoutRef.current = window.setTimeout(() => {
      readingApi
        .updatePreferences(userId, { readerFontSize: next })
        .catch(() => null);
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
      Math.max(margin + popoverWidth / 2, centeredLeft),
    );
    const estimatedHeight = 220;
    let placement: "top" | "bottom" = "top";
    if (rect.top < estimatedHeight + margin) placement = "bottom";
    if (
      placement === "bottom" &&
      rect.bottom + estimatedHeight + margin > viewportHeight
    ) {
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

  const loadExamples = useCallback(
    async (phrase: string) => {
      setSnippetState({ status: "loading", items: [], total: 0 });
      try {
        const response = await videoDictionaryApi.searchPhrase({
          phrase,
          limit: 12,
          userId,
        });
        setSnippetState({
          status: "ready",
          items: response.items,
          total: response.total,
        });
        setActiveSnippetIndex(0);
      } catch (err: any) {
        setSnippetState({
          status: "error",
          items: [],
          total: 0,
          error: err?.message ?? "Не удалось загрузить примеры.",
        });
      }
    },
    [userId],
  );

  useEffect(() => {
    if (!examplesOpen || !sliderRef.current || snippetState.items.length === 0)
      return;
    const node = sliderRef.current;
    const handleScroll = () => {
      if (!node) return;
      const center = node.scrollLeft + node.clientWidth / 2;
      let closest = 0;
      let minDist = Number.POSITIVE_INFINITY;
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const cardCenter = card.offsetLeft + rect.width / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < minDist) {
          minDist = dist;
          closest = index;
        }
      });
      setActiveSnippetIndex(closest);
    };
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [examplesOpen, snippetState.items.length]);

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
                const rect = (
                  event.target as HTMLElement
                ).getBoundingClientRect();
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
  const progressPercent = Math.round((progress?.progress ?? 0) * 100);
  const handleScroll = useCallback(() => {}, []);

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
    <PageShell scroll={false} pullToRefresh={false}>
      <S.ReaderShell ref={shellRef}>
        <S.ReaderHeader>
          <S.HeaderTitle>{book?.title ?? "THE GREAT GATSBY"}</S.HeaderTitle>
          <S.HeaderActions>
            <S.PageIndicator>
              {currentPage + 1}/{pages.length || 1} · {progressPercent}%
            </S.PageIndicator>
            <S.FontButton
              data-font-toggle
              onClick={() => setFontOpen((prev) => !prev)}
            >
              <Icon name="case-sensitive" size={18} />
            </S.FontButton>
          </S.HeaderActions>
        </S.ReaderHeader>

        <S.ReaderBody
          ref={contentRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {(pages[currentPage] ?? []).map(renderParagraph)}
        </S.ReaderBody>

        <S.ReaderFooter ref={footerRef} />

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
            {lookup?.status === "ready" &&
              lookupEntry &&
              (() => {
                const translation =
                  lookupEntry.translations?.find(
                    (value) => value.trim().length > 0,
                  ) ?? "";
                const otherTranslations = (lookupEntry.translations ?? [])
                  .filter((value) => value && value !== translation)
                  .slice(0, 4);
                const normalizedWord = lookupEntry.word.toLowerCase();
                const normalizedTranslation = translation.toLowerCase();
                const existingEntry = dictionary.items.find(
                  (item) =>
                    item.word.toLowerCase() === normalizedWord &&
                    item.translation.toLowerCase() === normalizedTranslation,
                );
                const isInDictionary = Boolean(existingEntry);
                const dictionaryActionLabel = isInDictionary
                  ? "в словаре"
                  : "+ в словарь";

                return (
                  <WordCard
                    word={lookupEntry.word}
                    translation={translation}
                    otherTranslationsRu={otherTranslations}
                    showExamplesButton={true}
                    examplesOpen={examplesOpen}
                    onToggleExamples={() => {
                      const next = !examplesOpen;
                      setExamplesOpen(next);
                      if (
                        next &&
                        lookupEntry.word &&
                        snippetState.status !== "ready"
                      ) {
                        loadExamples(lookupEntry.word);
                        sliderRef.current?.style.setProperty(
                          "--card-width",
                          `${EXAMPLE_CARD_WIDTH}px`,
                        );
                      }
                    }}
                    dictionaryActionLabel={dictionaryActionLabel}
                    dictionaryActionMode={isInDictionary ? "tag" : "button"}
                    dictionaryActionDisabled={isInDictionary}
                    onDictionaryAction={() => {
                      if (!lookupEntry?.word || !translation) return;
                      if (isInDictionary) return;
                      dispatch(
                        addWord({
                          query: lookupEntry.word,
                          lang: "en",
                          word: lookupEntry.word,
                          translation,
                        }),
                      );
                    }}
                    variant="compact"
                    size="subtitle"
                    reading
                  >
                    {examplesOpen &&
                      snippetState.status === "ready" &&
                      snippetState.items.length > 0 && (
                        <SearchSnippetsCarousel
                          items={snippetState.items}
                          highlight={lookupEntry.word}
                          activeIndex={activeSnippetIndex}
                          onOpenFullVideo={(snippet) => {
                            window.open(snippet.videoUrl, "_blank");
                          }}
                          total={snippetState.total}
                          sliderRef={sliderRef}
                          cardSize="compact"
                          onCardRef={(index, node) => {
                            cardRefs.current[index] = node;
                          }}
                          onFirstCardRef={(node) => {
                            firstCardRef.current = node;
                          }}
                        />
                      )}
                    {examplesOpen && snippetState.status === "loading" && (
                      <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                        Загружаем примеры...
                      </div>
                    )}
                    {examplesOpen && snippetState.status === "error" && (
                      <div style={{ color: "var(--tg-danger)", fontSize: 12 }}>
                        {snippetState.error ?? "Не удалось загрузить примеры."}
                      </div>
                    )}
                  </WordCard>
                );
              })()}
          </S.Popover>
        )}

        {fontOpen && (
          <S.FontPanel data-font-panel>
            <S.FontLabel>Размер шрифта</S.FontLabel>
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
