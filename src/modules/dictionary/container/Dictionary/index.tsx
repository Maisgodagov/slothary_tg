import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { useTelegram } from "../../../../app/providers/TelegramProvider";
import { selectAuth } from "../../../../features/auth/slice";
import {
  addWord,
  addPhrase,
  fetchDictionary,
  removeWord,
  removePhrase,
  selectDictionary,
} from "../../../../features/dictionary/slice";
import { WordCard } from "../../../../features/dictionary/components/WordCard";
import { Icon } from "../../../../shared/ui/Icon";
import { Loader } from "../../../../shared/ui/Loader";
import { PageShell } from "../../../../shared/ui/PageShell";
import { apiFetch } from "../../../../shared/api/client";
import { dictionaryModuleApi } from "../../api";
import type {
  MuellerEntry,
  PhraseSnippet,
  UserDictionaryEntry,
} from "../../api/types";
import { DeleteModal } from "../../components/DeleteModal";
import { SearchBar } from "../../components/SearchBar";
import { SearchSnippetsCarousel } from "../../components/SearchSnippetsCarousel";
import { SnippetCarousel } from "../../components/SnippetCarousel";
import { setLastQuery } from "../../store/slice";
import {
  Clickable,
  DeleteEntryButton,
  DictionarySection,
  DictionaryLayout,
  EmptyText,
  ErrorText,
  FilterButton,
  FilterRow,
  HelperText,
  InlineCenter,
  LoaderWrap,
  SectionTitle,
  SubtleText,
  UserList,
  UserEntryWrapper,
} from "./styles";

const PAGE_SIZE = 6;
const INITIAL_PAGE_SIZE = 2;
const SAMPLE_STAGE_SIZES = [300, 1200, 2400];
const STORAGE_KEY = "videoDictionaryState";
const HISTORY_KEY = "dictionarySearchHistory";
const HISTORY_LIMIT = 5;

const computePaddingSeconds = (phrase: string): number => {
  const trimmed = phrase.trim();
  if (!trimmed) return 2;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 2) return 2;
  if (wordCount <= 4) return 2;
  return 1;
};

const snippetKey = (snippet: PhraseSnippet) => {
  if (snippet.id) return snippet.id;
  return `${snippet.contentId}-${snippet.startSeconds}-${snippet.endSeconds}-${snippet.matchedText}`;
};

const dedupeSnippets = (list: PhraseSnippet[]) => {
  const seen = new Set<string>();
  return list.filter((snippet) => {
    const key = snippetKey(snippet);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const mergeSnippets = (base: PhraseSnippet[], next: PhraseSnippet[]) => {
  const seen = new Set(base.map((snippet) => snippetKey(snippet)));
  const merged = [...base];
  next.forEach((snippet) => {
    const key = snippetKey(snippet);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(snippet);
  });
  return merged;
};

const detectLanguage = (value: string) => /[а-яё]/i.test(value);

const filterPureTranslations = (list: string[]) =>
  list.filter((value) => !/[a-z]/i.test(value));

const sendShareToBot = async (payload: {
  initData: string;
  word: string;
  translation?: string;
  extraTranslations?: string[];
  synonyms?: string[];
  videoUrl?: string;
  startSeconds?: number;
  endSeconds?: number;
  exampleText?: string;
  exampleIndex?: number;
  examplesTotal?: number;
}) => {
  return apiFetch("share/word/send", {
    method: "POST",
    body: payload,
  });
};

const sendPhraseShareToBot = async (payload: {
  initData: string;
  phrase: string;
  translation?: string;
  videoUrl?: string;
  startSeconds?: number;
  endSeconds?: number;
  exampleText?: string;
  exampleIndex?: number;
  examplesTotal?: number;
}) => {
  return apiFetch("share/phrase/send", {
    method: "POST",
    body: payload,
  });
};

const showShareError = (webAppInstance: any, message: string) => {
  if (webAppInstance?.showAlert) {
    webAppInstance.showAlert(message);
    return;
  }
  window.alert(message);
};

export function DictionaryContainer() {
  const auth = useAppSelector(selectAuth);
  const { initData, webApp } = useTelegram();
  const dictionary = useAppSelector(selectDictionary);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [dictEntries, setDictEntries] = useState<MuellerEntry[]>([]);
  const [dictStatus, setDictStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [dictError, setDictError] = useState<string | null>(null);
  const [videoQuery, setVideoQuery] = useState("");
  const showExamples = true;
  const [examplesOpen, setExamplesOpen] = useState(true);
  const startParamHandledRef = useRef(false);
  const [items, setItems] = useState<PhraseSnippet[]>([]);
  const [phraseFallback, setPhraseFallback] = useState<{
    phrase: string;
    translation?: string;
  } | null>(null);
  const [highlight, setHighlight] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [forceLoadAttempts, setForceLoadAttempts] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [sampleStage, setSampleStage] = useState(0);
  const [total, setTotal] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const lastLoadMoreAtRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userExamplesOpenId, setUserExamplesOpenId] = useState<string | null>(
    null,
  );
  const [userExpandedTranslationsId, setUserExpandedTranslationsId] = useState<
    string | null
  >(null);
  const [userExpandedPhraseId, setUserExpandedPhraseId] = useState<
    string | null
  >(null);
  const [userDictionaryFilter, setUserDictionaryFilter] = useState<
    "all" | "word" | "phrase"
  >("all");
  const [userExampleState, setUserExampleState] = useState<
    Record<
      string,
      {
        status: "idle" | "loading" | "ready" | "error";
        items: PhraseSnippet[];
        total?: number;
        hasMore?: boolean;
        nextCursor?: string | null;
        isLoadingMore?: boolean;
        error?: string;
      }
    >
  >({});
  const [userDictionaryDetails, setUserDictionaryDetails] = useState<
    Record<
      string,
      {
        status: "idle" | "loading" | "ready" | "error";
        translationsRu: string[];
        synonyms: string[];
        error?: string;
      }
    >
  >({});
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    word: string;
    translation: string;
    type: "word" | "phrase";
  } | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const firstCardRef = useRef<HTMLDivElement | null>(null);
  const cardWidthRef = useRef(0);
  const scrollRaf = useRef<number | null>(null);
  const scrollEndTimer = useRef<number | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lastSettledIndex = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        query?: string;
        videoQuery?: string;
        dictEntries?: MuellerEntry[];
        items?: PhraseSnippet[];
        total?: number;
        nextCursor?: string | null;
        hasMore?: boolean;
        activeIndex?: number;
        hasSearched?: boolean;
        examplesOpen?: boolean;
      };
      if (saved.query) setQuery(saved.query);
      if (saved.videoQuery) setVideoQuery(saved.videoQuery);
      if (saved.dictEntries && Array.isArray(saved.dictEntries)) {
        setDictEntries(saved.dictEntries);
        setDictStatus(saved.dictEntries.length ? "ready" : "idle");
      }
      if (saved.items && Array.isArray(saved.items)) {
        setItems(saved.items);
        setStatus(saved.items.length ? "ready" : "idle");
      }
      if (typeof saved.total === "number") setTotal(saved.total);
      setNextCursor(saved.nextCursor ?? null);
      setHasMore(Boolean(saved.hasMore));
      setActiveIndex(saved.activeIndex ?? 0);
      setHasSearched(Boolean(saved.hasSearched));
      if (typeof saved.examplesOpen === "boolean") {
        setExamplesOpen(saved.examplesOpen);
      }
      if (saved.query) setHighlight(saved.query);
    } catch {
      // ignore restore errors
    }
  }, []);

  useEffect(() => {
    try {
      const rawHistory = localStorage.getItem(HISTORY_KEY);
      if (!rawHistory) return;
      const parsed = JSON.parse(rawHistory);
      if (Array.isArray(parsed)) {
        setSearchHistory(parsed.filter((value) => typeof value === "string"));
      }
    } catch {
      // ignore restore errors
    }
  }, []);

  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = auth.profile?.id ?? null;
    if (!userId) {
      lastUserIdRef.current = null;
      return;
    }
    if (lastUserIdRef.current === userId) return;
    lastUserIdRef.current = userId;
    dispatch(fetchDictionary());
  }, [auth.profile?.id, dispatch]);

  useEffect(() => {
    if (dictionary.items.length === 0) return;
    if (userExpandedTranslationsId) return;
    const firstWord = (dictionary.items as UserDictionaryEntry[]).find(
      (entry) => (entry.type ?? "word") === "word",
    );
    setUserExpandedTranslationsId(firstWord?.id ?? null);
  }, [dictionary.items, userExpandedTranslationsId]);

  const filteredDictionaryItems = useMemo(() => {
    const items = dictionary.items as UserDictionaryEntry[];
    if (userDictionaryFilter === "all") return items;
    return items.filter(
      (entry) => (entry.type ?? "word") === userDictionaryFilter,
    );
  }, [dictionary.items, userDictionaryFilter]);

  useEffect(() => {
    try {
      const payload = {
        query,
        videoQuery,
        dictEntries,
        items,
        total,
        nextCursor,
        hasMore,
        activeIndex,
        hasSearched,
        examplesOpen,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore persist errors
    }
  }, [
    activeIndex,
    dictEntries,
    examplesOpen,
    hasMore,
    hasSearched,
    items,
    nextCursor,
    query,
    total,
    videoQuery,
  ]);

  const updateCardWidth = useCallback(() => {
    if (!firstCardRef.current) return;
    const width = firstCardRef.current.getBoundingClientRect().width;
    cardWidthRef.current = width;
    sliderRef.current?.style.setProperty("--card-width", `${width}px`);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setVideoQuery("");
    setDictEntries([]);
    setDictStatus("idle");
    setDictError(null);
    setExamplesOpen(true);
    setItems([]);
    setPhraseFallback(null);
    setHighlight("");
    setHasMore(false);
    setNextCursor(null);
    setTotal(0);
    setStatus("idle");
    setError(null);
    setHasSearched(false);
    setActiveIndex(0);
    setForceLoadAttempts(0);
    setSampleStage(0);
    isLoadingMoreRef.current = false;
    lastLoadMoreAtRef.current = 0;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleSearch = useCallback(
    async (value?: string) => {
      const trimmed = (value ?? query).trim();
      if (!trimmed) return;

      dispatch(setLastQuery(trimmed));
      setHistoryOpen(false);
      setSearchHistory((prev) => {
        const next = [
          trimmed,
          ...prev.filter(
            (item) => item.toLowerCase() !== trimmed.toLowerCase(),
          ),
        ].slice(0, HISTORY_LIMIT);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          // ignore storage errors
        }
        return next;
      });

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("loading");
      setError(null);
      setDictStatus("loading");
      setDictError(null);
      setHasSearched(true);
      setItems([]);
      setPhraseFallback(null);
      setHasMore(false);
      setNextCursor(null);
      setTotal(0);
      setActiveIndex(0);
      setForceLoadAttempts(0);
      setSampleStage(0);
      isLoadingMoreRef.current = false;
      lastLoadMoreAtRef.current = 0;
      setHighlight(trimmed);

      try {
        const trimmedWords = trimmed
          .split(/\s+/)
          .map((part) => part.trim())
          .filter(Boolean);
        const isRu = detectLanguage(trimmed);
        const isPhrase = trimmedWords.length >= 2;

        let dictionaryResults: MuellerEntry[] = [];
        let phraseDisplay = trimmed;
        let phraseTranslationText = "";
        let phraseVideoQuery = isRu ? "" : trimmed;
        if (!isPhrase) {
          dictionaryResults = await dictionaryModuleApi.searchMueller({
            word: trimmed,
            lang: isRu ? "ru" : "en",
          });
          setDictEntries(dictionaryResults);
          setDictStatus("ready");
        } else {
          setDictEntries([]);
          setDictStatus("ready");
        }

        if (dictionaryResults.length === 0 && isPhrase) {
          setPhraseFallback({
            phrase: trimmed,
            translation: "",
          });
          try {
            const phraseTranslation = await dictionaryModuleApi
              .translatePhrase(trimmed, isRu ? "ru" : "en", isRu ? "en" : "ru")
              .then((result) => result.translation)
              .catch(() => "");
            if (isRu) {
              phraseDisplay = phraseTranslation || trimmed;
              phraseTranslationText = trimmed;
              phraseVideoQuery = phraseTranslation || "";
            } else {
              phraseDisplay = trimmed;
              phraseTranslationText = phraseTranslation;
              phraseVideoQuery = trimmed;
            }
            setPhraseFallback({
              phrase: phraseDisplay,
              translation: phraseTranslationText,
            });
          } catch {
            // ignore word translation errors
          }
        }

        const primary = dictionaryResults[0];
        if (auth.profile?.id && primary?.word && primary.translations?.[0]) {
          dictionaryModuleApi
            .recordView(auth.profile.id, {
              query: trimmed.toLowerCase(),
              lang: isRu ? "ru" : "en",
              word: primary.word,
              translation: primary.translations[0],
            })
            .catch(() => null);
        }

        const nextVideoQuery = isPhrase
          ? phraseVideoQuery
          : isRu
            ? (dictionaryResults[0]?.word?.trim() ?? "")
            : trimmed;
        setVideoQuery(nextVideoQuery);
        setHighlight(nextVideoQuery || trimmed);

        if (!nextVideoQuery) {
          setItems([]);
          setHasMore(false);
          setNextCursor(null);
          setTotal(0);
          setStatus("ready");
          return;
        }

        const response = await dictionaryModuleApi.getVideoDictionary({
          phrase: nextVideoQuery,
          limit: INITIAL_PAGE_SIZE,
          cursor: null,
          paddingSeconds: computePaddingSeconds(nextVideoQuery),
          sampleSize: SAMPLE_STAGE_SIZES[0],
          userId: auth.profile?.id ?? null,
          signal: controller.signal,
        });

        const deduped = dedupeSnippets(response.items);
        const nextHasMore = response.hasMore && deduped.length > 0;
        setItems(deduped);
        setHasMore(nextHasMore);
        setNextCursor(nextHasMore ? response.nextCursor : null);
        setTotal(nextHasMore ? response.total : deduped.length);
        setStatus("ready");

        if (nextHasMore && response.nextCursor && deduped.length < PAGE_SIZE) {
          if (!isLoadingMoreRef.current) {
            isLoadingMoreRef.current = true;
            setIsLoadingMore(true);
            try {
              setSampleStage(1);
              const followUp = await dictionaryModuleApi.getVideoDictionary({
                phrase: nextVideoQuery,
                limit: PAGE_SIZE,
                cursor: response.nextCursor,
                paddingSeconds: computePaddingSeconds(nextVideoQuery),
                sampleSize: SAMPLE_STAGE_SIZES[1],
                userId: auth.profile?.id ?? null,
                signal: controller.signal,
              });
              setItems((prev) => {
                const merged = mergeSnippets(
                  prev,
                  dedupeSnippets(followUp.items),
                );
                const added = merged.length - prev.length;
                const followHasMore = followUp.hasMore && added > 0;
                setHasMore(followHasMore);
                setNextCursor(followHasMore ? followUp.nextCursor : null);
                setTotal(followHasMore ? followUp.total : merged.length);
                return merged;
              });
            } catch {
              // ignore prefetch errors
            } finally {
              isLoadingMoreRef.current = false;
              setIsLoadingMore(false);
            }
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        const message = err?.message ?? "Не удалось выполнить поиск";
        setError(message);
        setDictError(message);
        setStatus("error");
        setDictStatus("error");
      }
    },
    [auth.profile?.id, dispatch, query],
  );

  useEffect(() => {
    if (startParamHandledRef.current) return;
    const startParam = (window as any).Telegram?.WebApp?.initDataUnsafe
      ?.start_param;
    const urlParams = new URLSearchParams(window.location.search);
    const urlWord = urlParams.get("word");
    const urlPhrase = urlParams.get("phrase");
    let word = "";
    if (typeof startParam === "string" && startParam.startsWith("word_")) {
      word = startParam.slice("word_".length).trim();
    } else if (
      typeof startParam === "string" &&
      startParam.startsWith("phrase_")
    ) {
      word = startParam.slice("phrase_".length).trim();
    } else if (typeof urlPhrase === "string" && urlPhrase.trim()) {
      word = urlPhrase.trim();
    } else if (typeof urlWord === "string" && urlWord.trim()) {
      word = urlWord.trim();
    }
    if (!word) return;
    const normalizedWord =
      word.includes("_") && !word.includes(" ")
        ? word.replace(/_+/g, " ").trim()
        : word.trim();
    if (sessionStorage.getItem("dictionary-start-handled") === "1") return;
    startParamHandledRef.current = true;
    sessionStorage.setItem("dictionary-start-handled", "1");
    setQuery(normalizedWord);
    setExamplesOpen(true);
    handleSearch(normalizedWord);
  }, [handleSearch]);

  const handleLoadMore = useCallback(
    async (force = false) => {
      if (isLoadingMoreRef.current) return;
      if (!hasMore && !force) return;
      if (force && forceLoadAttempts >= 3) return;
      const phrase = videoQuery.trim();
      if (!phrase) return;
      if (items.length === 0 && !hasMore) return;
      const cursorOverride =
        !hasMore && force ? String(items.length) : nextCursor;
      if (!cursorOverride) return;
      const now = Date.now();
      if (now - lastLoadMoreAtRef.current < 400) return;
      lastLoadMoreAtRef.current = now;

      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      const nextStage =
        !hasMore && force
          ? Math.min(sampleStage + 1, SAMPLE_STAGE_SIZES.length - 1)
          : sampleStage;
      if (!hasMore && force) {
        setForceLoadAttempts((prev) => prev + 1);
        setSampleStage(nextStage);
      }

      try {
        const response = await dictionaryModuleApi.getVideoDictionary({
          phrase,
          limit: PAGE_SIZE,
          cursor: cursorOverride,
          paddingSeconds: computePaddingSeconds(videoQuery),
          sampleSize: SAMPLE_STAGE_SIZES[nextStage],
          userId: auth.profile?.id ?? null,
        });

        setItems((prev) => {
          const merged = mergeSnippets(prev, dedupeSnippets(response.items));
          const added = merged.length - prev.length;
          const nextHasMore = response.hasMore && added > 0;
          setHasMore(nextHasMore);
          setNextCursor(nextHasMore ? response.nextCursor : null);
          setTotal(nextHasMore ? response.total : merged.length);
          return merged;
        });
      } catch (err: any) {
        setError(err?.message ?? "Не удалось загрузить еще результаты");
      } finally {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    },
    [
      auth.profile?.id,
      forceLoadAttempts,
      hasMore,
      isLoadingMore,
      items.length,
      nextCursor,
      sampleStage,
      videoQuery,
    ],
  );

  useEffect(() => {
    const needsMore = items.length < 30;
    const canForce = !hasMore && needsMore && forceLoadAttempts < 3;
    if (items.length > 0 && activeIndex >= items.length - 3) {
      handleLoadMore(canForce);
    }
  }, [
    activeIndex,
    forceLoadAttempts,
    handleLoadMore,
    hasMore,
    isLoadingMore,
    items.length,
  ]);

  const getCenteredIndex = useCallback(() => {
    if (!sliderRef.current || items.length === 0) return 0;
    const containerRect = sliderRef.current.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((node, index) => {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(center - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }, [items.length]);

  const snapToIndex = useCallback((index: number) => {
    const card = cardRefs.current[index];
    if (!card) return;
    card.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, []);

  useEffect(() => {
    if (!examplesOpen || !firstCardRef.current) return;
    updateCardWidth();
    const observer = new ResizeObserver(() => updateCardWidth());
    observer.observe(firstCardRef.current);
    return () => observer.disconnect();
  }, [examplesOpen, items.length, updateCardWidth]);

  useEffect(() => {
    if (!examplesOpen || !sliderRef.current || items.length === 0) return;
    requestAnimationFrame(() => {
      updateCardWidth();
      snapToIndex(Math.min(activeIndex, items.length - 1));
    });
  }, [examplesOpen, activeIndex, items.length, snapToIndex, updateCardWidth]);

  useEffect(() => {
    if (!examplesOpen || !sliderRef.current || cardWidthRef.current === 0)
      return;

    const handleScroll = () => {
      if (!sliderRef.current || cardWidthRef.current === 0) return;
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = requestAnimationFrame(() => {
        const centered = getCenteredIndex();
        setActiveIndex(centered);
      });

      if (scrollEndTimer.current) {
        window.clearTimeout(scrollEndTimer.current);
      }
      scrollEndTimer.current = window.setTimeout(() => {
        const centered = getCenteredIndex();
        const maxStep = 1;
        const clamped = Math.max(
          0,
          Math.min(
            items.length - 1,
            Math.max(
              lastSettledIndex.current - maxStep,
              Math.min(lastSettledIndex.current + maxStep, centered),
            ),
          ),
        );
        lastSettledIndex.current = clamped;
        setActiveIndex(clamped);
        snapToIndex(clamped);
      }, 180);
    };

    const node = sliderRef.current;
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [examplesOpen, getCenteredIndex, items.length, snapToIndex]);

  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) {
      setActiveIndex(items.length - 1);
    }
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (items.length === 0) return;
    lastSettledIndex.current = Math.min(activeIndex, items.length - 1);
  }, [activeIndex, items.length]);

  const helperText = useMemo(() => {
    if (status === "loading" || dictStatus === "loading") return null;
    if (!hasSearched) return null;
    if (status === "error") return error ?? "Произошла ошибка";
    if (dictStatus === "error") return dictError ?? "Произошла ошибка";
    if (dictStatus === "ready" && dictEntries.length === 0 && !phraseFallback) {
      return "Перевод не найден. Попробуйте другой запрос.";
    }
    if (
      status === "ready" &&
      items.length === 0 &&
      dictEntries.length === 0 &&
      !phraseFallback
    ) {
      return "Ничего не найдено. Попробуйте другой запрос.";
    }
    return null;
  }, [
    dictEntries.length,
    dictError,
    dictStatus,
    error,
    hasSearched,
    items.length,
    status,
    phraseFallback,
  ]);

  const handleOpenFullVideo = useCallback(
    (snippet: PhraseSnippet) => {
      if (!snippet.contentId) return;
      navigate(
        `/video?contentId=${encodeURIComponent(snippet.contentId)}&focus=${Date.now()}`,
      );
    },
    [navigate],
  );

  const loadUserExamples = useCallback(
    async (entryId: string, phrase: string) => {
      if (!auth.profile?.id) return;
      setUserExampleState((prev) => ({
        ...prev,
        [entryId]: {
          status: "loading",
          items: [],
          total: 0,
          hasMore: false,
          nextCursor: null,
          isLoadingMore: false,
        },
      }));

      try {
        const response = await dictionaryModuleApi.getVideoDictionary({
          phrase,
          limit: PAGE_SIZE,
          cursor: null,
          paddingSeconds: computePaddingSeconds(phrase),
          userId: auth.profile.id,
        });
        const items = dedupeSnippets(response.items);
        setUserExampleState((prev) => ({
          ...prev,
          [entryId]: {
            status: "ready",
            items,
            total: response.total,
            hasMore: response.hasMore,
            nextCursor: response.nextCursor,
            isLoadingMore: false,
          },
        }));
      } catch (err: any) {
        setUserExampleState((prev) => ({
          ...prev,
          [entryId]: {
            status: "error",
            items: [],
            total: 0,
            hasMore: false,
            nextCursor: null,
            isLoadingMore: false,
            error: err?.message ?? "Не удалось загрузить примеры.",
          },
        }));
      }
    },
    [auth.profile?.id],
  );

  const loadMoreUserExamples = useCallback(
    async (entryId: string, phrase: string) => {
      if (!auth.profile?.id) return;
      setUserExampleState((prev) => {
        const current = prev[entryId];
        if (!current || current.isLoadingMore || !current.hasMore) return prev;
        return {
          ...prev,
          [entryId]: { ...current, isLoadingMore: true },
        };
      });

      try {
        const current = userExampleState[entryId];
        const cursor = current?.nextCursor ?? null;
        const response = await dictionaryModuleApi.getVideoDictionary({
          phrase,
          limit: PAGE_SIZE,
          cursor,
          paddingSeconds: computePaddingSeconds(phrase),
          userId: auth.profile.id,
        });
        setUserExampleState((prev) => {
          const existing = prev[entryId];
          if (!existing) return prev;
          const merged = mergeSnippets(existing.items, response.items);
          return {
            ...prev,
            [entryId]: {
              ...existing,
              items: merged,
              total: response.total,
              hasMore: response.hasMore,
              nextCursor: response.nextCursor,
              isLoadingMore: false,
            },
          };
        });
      } catch (err: any) {
        setUserExampleState((prev) => {
          const existing = prev[entryId];
          if (!existing) return prev;
          return {
            ...prev,
            [entryId]: {
              ...existing,
              isLoadingMore: false,
              error: err?.message ?? "Не удалось загрузить примеры.",
            },
          };
        });
      }
    },
    [auth.profile?.id, userExampleState],
  );

  const loadUserDictionaryDetails = useCallback(
    async (entryId: string, word: string) => {
      setUserDictionaryDetails((prev) => ({
        ...prev,
        [entryId]: { status: "loading", translationsRu: [], synonyms: [] },
      }));

      try {
        const lang = detectLanguage(word) ? "ru" : "en";
        const entries = await dictionaryModuleApi.searchMueller({ word, lang });
        const primary = entries[0];
        const translationsRu = filterPureTranslations(
          primary?.translations ?? [],
        ).slice(0, 7);
        const synonyms = (primary?.synonyms ?? [])
          .filter((value) => value && /[a-z]/i.test(value))
          .slice(0, 7);
        setUserDictionaryDetails((prev) => ({
          ...prev,
          [entryId]: {
            status: "ready",
            translationsRu,
            synonyms,
          },
        }));
      } catch (err: any) {
        setUserDictionaryDetails((prev) => ({
          ...prev,
          [entryId]: {
            status: "error",
            translationsRu: [],
            synonyms: [],
            error: err?.message ?? "Не удалось загрузить переводы.",
          },
        }));
      }
    },
    [],
  );

  const toggleUserExamples = useCallback(
    (entryId: string, phrase: string) => {
      setExamplesOpen(false);
      setUserExamplesOpenId((prev) => {
        const nextValue = prev === entryId ? null : entryId;
        if (nextValue && userExampleState[entryId]?.status !== "ready") {
          loadUserExamples(entryId, phrase);
        }
        return nextValue;
      });
    },
    [loadUserExamples, userExampleState],
  );

  const toggleUserTranslations = useCallback(
    (entryId: string) => {
      setUserExpandedTranslationsId((prev) => {
        const nextValue = prev === entryId ? null : entryId;
        if (nextValue && userDictionaryDetails[nextValue]?.status !== "ready") {
          const entry = (dictionary.items as UserDictionaryEntry[]).find(
            (item: UserDictionaryEntry) => item.id === nextValue,
          );
          if (entry?.word) loadUserDictionaryDetails(entry.id, entry.word);
        }
        return nextValue;
      });
      setUserExamplesOpenId(null);
    },
    [dictionary.items, loadUserDictionaryDetails, userDictionaryDetails],
  );

  return (
    <PageShell>
      <DictionaryLayout>
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={() => handleSearch()}
          onClear={handleClear}
          historyItems={searchHistory}
          historyOpen={historyOpen}
          onOpenHistory={() => setHistoryOpen(true)}
          onCloseHistory={() => setHistoryOpen(false)}
          onSelectHistory={(value) => {
            setQuery(value);
            handleSearch(value);
            (document.activeElement as HTMLElement | null)?.blur?.();
          }}
          loading={status === "loading"}
        />

        {helperText && <HelperText>{helperText}</HelperText>}

        {(status === "loading" || dictStatus === "loading") && (
          <LoaderWrap>
            <Loader />
          </LoaderWrap>
        )}

        {dictStatus === "ready" &&
          dictEntries.length > 0 &&
          (() => {
            const isRuQuery = detectLanguage(highlight);
            const primaryEntry = dictEntries[0];
            const ruTranslationsAll = filterPureTranslations(
              primaryEntry?.translations ?? [],
            );
            const primaryEnglish = primaryEntry?.word?.trim() || query.trim();
            const primaryRussian = isRuQuery
              ? highlight.trim()
              : (ruTranslationsAll[0] ?? "");
            const otherTranslationsRu = ruTranslationsAll
              .filter((value) => value && value !== primaryRussian)
              .slice(0, 7);
            const synonymsAll = (primaryEntry?.synonyms ?? []).filter(
              (value) => value && /[a-z]/i.test(value),
            );
            const synonyms = synonymsAll
              .filter((value) => value !== primaryEnglish)
              .slice(0, 7);
            const hasSnippets = items.length > 0;
            const showSnippets = showExamples && examplesOpen && hasSnippets;
            const normalizedWord = primaryEnglish.toLowerCase();
            const normalizedTranslation = primaryRussian.trim().toLowerCase();
            const existingEntry = (
              dictionary.items as UserDictionaryEntry[]
            ).find(
              (entry: UserDictionaryEntry) =>
                (entry.type ?? "word") === "word" &&
                typeof entry.word === "string" &&
                entry.word.toLowerCase() === normalizedWord &&
                entry.translation.toLowerCase() === normalizedTranslation,
            );
            const isInDictionary = Boolean(existingEntry);
            const dictionaryActionLabel = isInDictionary
              ? "в словаре"
              : "+ в словарь";

            return (
              <WordCard
                word={primaryEnglish}
                translation={primaryRussian}
                otherTranslationsRu={otherTranslationsRu}
                synonyms={synonyms}
                onSynonymClick={(value) => {
                  setQuery(value);
                  handleSearch(value);
                }}
                showExamplesButton={showExamples && hasSnippets}
                examplesOpen={examplesOpen}
                onToggleExamples={() =>
                  setExamplesOpen((prev) => {
                    const nextValue = !prev;
                    if (nextValue) setUserExamplesOpenId(null);
                    return nextValue;
                  })
                }
                dictionaryActionLabel={dictionaryActionLabel}
                dictionaryActionMode={isInDictionary ? "tag" : "button"}
                dictionaryActionDisabled={isInDictionary}
                onDictionaryAction={() => {
                  if (!auth.profile?.id) return;
                  if (isInDictionary && existingEntry) {
                    dispatch(removeWord(existingEntry.id));
                    return;
                  }
                  const lang = isRuQuery ? "ru" : "en";
                  const queryValue = highlight.trim();
                  if (!queryValue) return;
                  dispatch(
                    addWord({
                      query: queryValue,
                      lang,
                      word: primaryEnglish,
                      translation: primaryRussian,
                    }),
                  );
                }}
                shareActionLabel={<Icon name="repost" size={16} />}
                shareActionLoading={isSharing}
                onShare={async () => {
                  if (!initData) {
                    showShareError(
                      webApp,
                      "Откройте приложение через Telegram, чтобы поделиться.",
                    );
                    return;
                  }
                  if (!auth.tokens?.accessToken) {
                    showShareError(webApp, "Нужно войти, чтобы поделиться.");
                    return;
                  }
                  if (isSharing) return;
                  const activeSnippet = items[activeIndex];
                  const exampleText =
                    activeSnippet?.contextText ||
                    activeSnippet?.matchedText ||
                    activeSnippet?.translationContextText ||
                    "";
                  const exampleIndex = activeIndex + 1;
                  const examplesTotal = total || 0;
                  try {
                    setIsSharing(true);
                    await sendShareToBot({
                      initData,
                      word: primaryEnglish,
                      translation: primaryRussian,
                      extraTranslations: otherTranslationsRu,
                      synonyms,
                      videoUrl: activeSnippet?.videoUrl,
                      startSeconds: activeSnippet?.startSeconds,
                      endSeconds: activeSnippet?.endSeconds,
                      exampleText,
                      exampleIndex,
                      examplesTotal,
                    });
                    if (webApp?.showAlert) {
                      webApp.showAlert(
                        "Сообщение отправлено в бот. Перешлите его нужному человеку.",
                      );
                    }
                  } catch (error: any) {
                    const message =
                      typeof error?.message === "string"
                        ? `Не удалось отправить: ${error.message}`
                        : "Не удалось отправить сообщение.";
                    showShareError(webApp, message);
                  } finally {
                    setIsSharing(false);
                  }
                }}
              >
                {showSnippets && (
                  <div
                    style={{
                      border: "1px solid var(--tg-border)",
                      background: "var(--tg-surface)",
                      borderRadius: 32,
                      padding: "4px 2px 6px",
                      maxWidth: "100%",
                      overflow: "hidden",
                    }}
                  >
                    <SearchSnippetsCarousel
                      items={items}
                      highlight={highlight}
                      activeIndex={activeIndex}
                      onOpenFullVideo={handleOpenFullVideo}
                      total={total}
                      sliderRef={sliderRef}
                      onCardRef={(index, node) => {
                        cardRefs.current[index] = node;
                      }}
                      onFirstCardRef={(node) => {
                        firstCardRef.current = node;
                      }}
                    />
                  </div>
                )}
              </WordCard>
            );
          })()}

        {dictStatus === "ready" &&
          dictEntries.length === 0 &&
          phraseFallback &&
          (() => {
            const hasSnippets = items.length > 0;
            const showSnippets = showExamples && examplesOpen && hasSnippets;
            const normalizedPhrase = phraseFallback.phrase.trim().toLowerCase();
            const normalizedPhraseTranslation = (
              phraseFallback.translation ?? ""
            )
              .trim()
              .toLowerCase();
            const existingPhraseEntry = (
              dictionary.items as UserDictionaryEntry[]
            ).find(
              (entry: UserDictionaryEntry) =>
                entry.type === "phrase" &&
                (entry.phrase ?? entry.word ?? "").toLowerCase() ===
                  normalizedPhrase &&
                entry.translation.toLowerCase() === normalizedPhraseTranslation,
            );
            const isPhraseInDictionary = Boolean(existingPhraseEntry);
            return (
              <WordCard
                word={phraseFallback.phrase}
                translation={phraseFallback.translation ?? ""}
                showExamplesButton={showExamples && hasSnippets}
                examplesOpen={examplesOpen}
                onToggleExamples={() => setExamplesOpen((prev) => !prev)}
                dictionaryActionMode="button"
                dictionaryActionLabel={
                  isPhraseInDictionary ? "в словаре" : "+ в словарь"
                }
                dictionaryActionDisabled={
                  isPhraseInDictionary || !phraseFallback.translation
                }
                onDictionaryAction={() => {
                  if (!auth.profile?.id) return;
                  if (isPhraseInDictionary && existingPhraseEntry) {
                    dispatch(removePhrase(existingPhraseEntry.id));
                    return;
                  }
                  const queryValue = query.trim();
                  if (!queryValue) return;
                  dispatch(
                    addPhrase({
                      query: queryValue,
                      lang: detectLanguage(queryValue) ? "ru" : "en",
                    }),
                  );
                }}
                shareActionLabel={<Icon name="repost" size={16} />}
                shareActionLoading={isSharing}
                onShare={async () => {
                  if (!initData) {
                    showShareError(
                      webApp,
                      "Откройте приложение через Telegram, чтобы поделиться.",
                    );
                    return;
                  }
                  if (!auth.tokens?.accessToken) {
                    showShareError(webApp, "Нужно войти, чтобы поделиться.");
                    return;
                  }
                  if (isSharing) return;
                  const activeSnippet = items[activeIndex];
                  const exampleText =
                    activeSnippet?.contextText ||
                    activeSnippet?.matchedText ||
                    activeSnippet?.translationContextText ||
                    "";
                  const exampleIndex = activeIndex + 1;
                  const examplesTotal = total || 0;
                  try {
                    setIsSharing(true);
                    await sendPhraseShareToBot({
                      initData,
                      phrase: phraseFallback.phrase,
                      translation: phraseFallback.translation ?? "",
                      videoUrl: activeSnippet?.videoUrl,
                      startSeconds: activeSnippet?.startSeconds,
                      endSeconds: activeSnippet?.endSeconds,
                      exampleText,
                      exampleIndex,
                      examplesTotal,
                    });
                    if (webApp?.showAlert) {
                      webApp.showAlert(
                        "Сообщение отправлено в бот. Перешлите его нужному человеку.",
                      );
                    }
                  } catch (error: any) {
                    const message =
                      typeof error?.message === "string"
                        ? `Не удалось отправить: ${error.message}`
                        : "Не удалось отправить сообщение.";
                    showShareError(webApp, message);
                  } finally {
                    setIsSharing(false);
                  }
                }}
              >
                {showSnippets && (
                  <div
                    style={{
                      border: "1px solid var(--tg-border)",
                      background: "var(--tg-surface)",
                      borderRadius: 26,
                      padding: "4px 2px 6px",
                      maxWidth: "100%",
                      overflow: "hidden",
                    }}
                  >
                    <SearchSnippetsCarousel
                      items={items}
                      highlight={highlight}
                      activeIndex={activeIndex}
                      onOpenFullVideo={handleOpenFullVideo}
                      total={total}
                      sliderRef={sliderRef}
                      onCardRef={(index, node) => {
                        cardRefs.current[index] = node;
                      }}
                      onFirstCardRef={(node) => {
                        firstCardRef.current = node;
                      }}
                    />
                  </div>
                )}
              </WordCard>
            );
          })()}

        <DictionarySection>
          <SectionTitle>Мой словарь</SectionTitle>
          <FilterRow>
            <FilterButton
              type="button"
              $active={userDictionaryFilter === "all"}
              onClick={() => setUserDictionaryFilter("all")}
            >
              все
            </FilterButton>
            <FilterButton
              type="button"
              $active={userDictionaryFilter === "word"}
              onClick={() => setUserDictionaryFilter("word")}
            >
              слова
            </FilterButton>
            <FilterButton
              type="button"
              $active={userDictionaryFilter === "phrase"}
              onClick={() => setUserDictionaryFilter("phrase")}
            >
              фразы
            </FilterButton>
          </FilterRow>
          {filteredDictionaryItems.length === 0 && (
            <EmptyText>
              Здесь пока пусто. Добавляйте новые слова и фразы в словарь, и они
              будут появляться в этом списке.
            </EmptyText>
          )}
          <UserList>
            {filteredDictionaryItems.map((entry: UserDictionaryEntry) => {
              const isPhraseEntry = entry.type === "phrase";
              const open = userExamplesOpenId === entry.id;
              const state = userExampleState[entry.id] ?? {
                status: "idle",
                items: [],
              };
              const expanded =
                !isPhraseEntry && userExpandedTranslationsId === entry.id;
              const phraseExpanded =
                isPhraseEntry && userExpandedPhraseId === entry.id;
              const otherTranslations = expanded
                ? entry.otherTranslations
                : undefined;
              const hasRuTranslations =
                expanded &&
                Boolean(
                  otherTranslations?.some((value) => detectLanguage(value)),
                );
              const otherTranslationsRu = hasRuTranslations
                ? otherTranslations
                : undefined;
              const synonyms =
                expanded && !hasRuTranslations ? otherTranslations : undefined;
              const details = userDictionaryDetails[entry.id];
              const detailsTranslations =
                expanded && details?.status === "ready"
                  ? details.translationsRu
                  : undefined;
              const detailsSynonyms =
                expanded && details?.status === "ready"
                  ? details.synonyms
                  : undefined;
              const displayWord = isPhraseEntry
                ? (entry.phrase ?? entry.word ?? "")
                : (entry.word ?? "");
              const displayTranslation = entry.translation ?? "";

              return (
                <UserEntryWrapper key={entry.id}>
                  {(expanded || phraseExpanded) && (
                    <DeleteEntryButton
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget({
                          id: entry.id,
                          word: displayWord,
                          translation: displayTranslation,
                          type: entry.type ?? "word",
                        });
                      }}
                      aria-label="Удалить"
                    >
                      <Icon name="close" size={14} />
                    </DeleteEntryButton>
                  )}

                  <Clickable
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest("button"))
                        return;
                      if (isPhraseEntry) {
                        setUserExpandedPhraseId((prev) => {
                          const nextValue = prev === entry.id ? null : entry.id;
                          if (prev === entry.id) {
                            setUserExamplesOpenId(null);
                          }
                          return nextValue;
                        });
                      } else {
                        toggleUserTranslations(entry.id);
                      }
                    }}
                  >
                    <WordCard
                      word={displayWord}
                      translation={displayTranslation}
                      otherTranslationsRu={
                        detailsTranslations ?? otherTranslationsRu
                      }
                      synonyms={detailsSynonyms ?? synonyms}
                      showExamplesButton={
                        isPhraseEntry ? phraseExpanded : expanded
                      }
                      examplesOpen={open}
                      onToggleExamples={() => {
                        if (isPhraseEntry && !phraseExpanded) return;
                        toggleUserExamples(entry.id, displayWord);
                      }}
                      dictionaryActionMode="none"
                      variant="compact"
                    >
                      {open && (
                        <>
                          {state.status === "loading" && (
                            <InlineCenter>
                              <Loader />
                            </InlineCenter>
                          )}
                          {state.status === "error" && (
                            <ErrorText>{state.error}</ErrorText>
                          )}
                          {state.status === "ready" &&
                            state.items.length === 0 && (
                              <SubtleText>Примеры не найдены.</SubtleText>
                            )}
                          {state.items.length > 0 && (
                            <SnippetCarousel
                              items={state.items}
                              highlight={displayWord}
                              onOpenFullVideo={handleOpenFullVideo}
                              total={state.total}
                              hasMore={state.hasMore}
                              isLoadingMore={state.isLoadingMore}
                              onLoadMore={() =>
                                loadMoreUserExamples(entry.id, displayWord)
                              }
                            />
                          )}
                        </>
                      )}
                    </WordCard>
                  </Clickable>
                </UserEntryWrapper>
              );
            })}
          </UserList>
        </DictionarySection>
      </DictionaryLayout>

      <DeleteModal
        open={Boolean(deleteTarget)}
        word={deleteTarget?.word ?? ""}
        translation={deleteTarget?.translation ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "phrase") {
            dispatch(removePhrase(deleteTarget.id));
          } else {
            dispatch(removeWord(deleteTarget.id));
          }
          setDeleteTarget(null);
        }}
      />
    </PageShell>
  );
}
