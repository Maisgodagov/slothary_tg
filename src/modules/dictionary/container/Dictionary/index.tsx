import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import { useTelegram } from '../../../../app/providers/TelegramProvider';
import { selectAuth } from '../../../../features/auth/slice';
import {
  addWord,
  fetchDictionary,
  removeWord,
  selectDictionary,
} from '../../../../features/dictionary/slice';
import { WordCard } from '../../../../features/dictionary/components/WordCard';
import { Icon } from '../../../../shared/ui/Icon';
import { Loader } from '../../../../shared/ui/Loader';
import { PageShell } from '../../../../shared/ui/PageShell';
import { apiFetch } from '../../../../shared/api/client';
import { dictionaryModuleApi } from '../../api';
import type { MuellerEntry, PhraseSnippet, UserDictionaryEntry } from '../../api/types';
import { DeleteModal } from '../../components/DeleteModal';
import { SearchBar } from '../../components/SearchBar';
import { SearchSnippetsCarousel } from '../../components/SearchSnippetsCarousel';
import { SnippetCarousel } from '../../components/SnippetCarousel';
import { setLastQuery } from '../../store/slice';
import {
  Clickable,
  DeleteEntryButton,
  DictionarySection,
  DictionaryLayout,
  EmptyText,
  ErrorText,
  HelperText,
  InlineCenter,
  LoaderWrap,
  SectionTitle,
  SubtleText,
  UserList,
  UserEntryWrapper,
} from './styles';

const PAGE_SIZE = 6;
const STORAGE_KEY = 'videoDictionaryState';
const HISTORY_KEY = 'dictionarySearchHistory';
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
  return apiFetch('share/word/send', {
    method: 'POST',
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
  const [query, setQuery] = useState('');
  const [dictEntries, setDictEntries] = useState<MuellerEntry[]>([]);
  const [dictStatus, setDictStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [dictError, setDictError] = useState<string | null>(null);
  const [videoQuery, setVideoQuery] = useState('');
  const showExamples = true;
  const [examplesOpen, setExamplesOpen] = useState(true);
  const startParamHandledRef = useRef(false);
  const [items, setItems] = useState<PhraseSnippet[]>([]);
  const [highlight, setHighlight] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userExamplesOpenId, setUserExamplesOpenId] = useState<string | null>(null);
  const [userExpandedTranslationsId, setUserExpandedTranslationsId] = useState<string | null>(null);
  const [userExampleState, setUserExampleState] = useState<
    Record<
      string,
      {
        status: 'idle' | 'loading' | 'ready' | 'error';
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
        status: 'idle' | 'loading' | 'ready' | 'error';
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

  const startParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
  const urlWord = new URLSearchParams(window.location.search).get('word');
  const showBotBanner =
    Boolean(startParam || urlWord) && localStorage.getItem('bot-started') !== '1';

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
        setDictStatus(saved.dictEntries.length ? 'ready' : 'idle');
      }
      if (saved.items && Array.isArray(saved.items)) {
        setItems(saved.items);
        setStatus(saved.items.length ? 'ready' : 'idle');
      }
      if (typeof saved.total === 'number') setTotal(saved.total);
      setNextCursor(saved.nextCursor ?? null);
      setHasMore(Boolean(saved.hasMore));
      setActiveIndex(saved.activeIndex ?? 0);
      setHasSearched(Boolean(saved.hasSearched));
      if (typeof saved.examplesOpen === 'boolean') {
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
        setSearchHistory(parsed.filter((value) => typeof value === 'string'));
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
    setUserExpandedTranslationsId(dictionary.items[0]?.id ?? null);
  }, [dictionary.items, userExpandedTranslationsId]);

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
  }, [activeIndex, dictEntries, examplesOpen, hasMore, hasSearched, items, nextCursor, query, total, videoQuery]);

  const updateCardWidth = useCallback(() => {
    if (!firstCardRef.current) return;
    const width = firstCardRef.current.getBoundingClientRect().width;
    cardWidthRef.current = width;
    sliderRef.current?.style.setProperty('--card-width', `${width}px`);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setVideoQuery('');
    setDictEntries([]);
    setDictStatus('idle');
    setDictError(null);
    setExamplesOpen(true);
    setItems([]);
    setHighlight('');
    setHasMore(false);
    setNextCursor(null);
    setTotal(0);
    setStatus('idle');
    setError(null);
    setHasSearched(false);
    setActiveIndex(0);
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
        const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
          0,
          HISTORY_LIMIT,
        );
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

      setStatus('loading');
      setError(null);
      setDictStatus('loading');
      setDictError(null);
      setHasSearched(true);
      setItems([]);
      setHasMore(false);
      setNextCursor(null);
      setTotal(0);
      setActiveIndex(0);
      setHighlight(trimmed);

      try {
        const isRu = detectLanguage(trimmed);
        const dictionaryResults = await dictionaryModuleApi.searchMueller({
          word: trimmed,
          lang: isRu ? 'ru' : 'en',
        });

        setDictEntries(dictionaryResults);
        setDictStatus('ready');

        const primary = dictionaryResults[0];
        if (auth.profile?.id && primary?.word && primary.translations?.[0]) {
          dictionaryModuleApi
            .recordView(auth.profile.id, {
              query: trimmed.toLowerCase(),
              lang: isRu ? 'ru' : 'en',
              word: primary.word,
              translation: primary.translations[0],
            })
            .catch(() => null);
        }

        const nextVideoQuery = isRu ? dictionaryResults[0]?.word?.trim() ?? '' : trimmed;
        setVideoQuery(nextVideoQuery);
        setHighlight(nextVideoQuery || trimmed);

        if (!nextVideoQuery) {
          setItems([]);
          setHasMore(false);
          setNextCursor(null);
          setTotal(0);
          setStatus('ready');
          return;
        }

        const response = await dictionaryModuleApi.getVideoDictionary({
          phrase: nextVideoQuery,
          limit: PAGE_SIZE,
          cursor: null,
          paddingSeconds: computePaddingSeconds(nextVideoQuery),
          userId: auth.profile?.id ?? null,
          signal: controller.signal,
        });

        const deduped = dedupeSnippets(response.items);
        const nextHasMore = response.hasMore && deduped.length > 0;
        setItems(deduped);
        setHasMore(nextHasMore);
        setNextCursor(nextHasMore ? response.nextCursor : null);
        setTotal(nextHasMore ? response.total : deduped.length);
        setStatus('ready');
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        const message = err?.message ?? 'Не удалось выполнить поиск';
        setError(message);
        setDictError(message);
        setStatus('error');
        setDictStatus('error');
      }
    },
    [auth.profile?.id, dispatch, query],
  );

  useEffect(() => {
    if (startParamHandledRef.current) return;
    const startParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
    const urlWord = new URLSearchParams(window.location.search).get('word');
    let word = '';
    if (typeof startParam === 'string' && startParam.startsWith('word_')) {
      word = startParam.slice('word_'.length).trim();
    } else if (typeof urlWord === 'string' && urlWord.trim()) {
      word = urlWord.trim();
    }
    if (!word) return;
    if (sessionStorage.getItem('dictionary-start-handled') === '1') return;
    startParamHandledRef.current = true;
    sessionStorage.setItem('dictionary-start-handled', '1');
    setQuery(word);
    setExamplesOpen(true);
    handleSearch(word);
  }, [handleSearch]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const response = await dictionaryModuleApi.getVideoDictionary({
        phrase: videoQuery.trim(),
        limit: PAGE_SIZE,
        cursor: nextCursor,
        paddingSeconds: computePaddingSeconds(videoQuery),
        userId: auth.profile?.id ?? null,
      });

      setItems((prev) => {
        const merged = mergeSnippets(prev, response.items);
        const added = merged.length - prev.length;
        const nextHasMore = response.hasMore && added > 0;
        setHasMore(nextHasMore);
        setNextCursor(nextHasMore ? response.nextCursor : null);
        setTotal(nextHasMore ? response.total : merged.length);
        return merged;
      });
    } catch (err: any) {
      setError(err?.message ?? 'Не удалось загрузить еще результаты');
    } finally {
      setIsLoadingMore(false);
    }
  }, [auth.profile?.id, hasMore, isLoadingMore, nextCursor, videoQuery]);

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;
    if (activeIndex >= items.length - 2) {
      handleLoadMore();
    }
  }, [activeIndex, handleLoadMore, hasMore, isLoadingMore, items.length]);

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
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
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
    if (!examplesOpen || !sliderRef.current || cardWidthRef.current === 0) return;

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
    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => node.removeEventListener('scroll', handleScroll);
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
    if (status === 'loading' || dictStatus === 'loading') return null;
    if (!hasSearched) return null;
    if (status === 'error') return error ?? 'Произошла ошибка';
    if (dictStatus === 'error') return dictError ?? 'Произошла ошибка';
    if (dictStatus === 'ready' && dictEntries.length === 0) {
      return 'Перевод не найден. Попробуйте другой запрос.';
    }
    if (status === 'ready' && items.length === 0 && dictEntries.length === 0) {
      return 'Ничего не найдено. Попробуйте другой запрос.';
    }
    return null;
  }, [dictEntries.length, dictError, dictStatus, error, hasSearched, items.length, status]);

  const handleOpenFullVideo = useCallback(
    (snippet: PhraseSnippet) => {
      if (!snippet.contentId) return;
      navigate(`/video?contentId=${encodeURIComponent(snippet.contentId)}&focus=${Date.now()}`);
    },
    [navigate],
  );

  const loadUserExamples = useCallback(
    async (entryId: string, phrase: string) => {
      if (!auth.profile?.id) return;
      setUserExampleState((prev) => ({
        ...prev,
        [entryId]: {
          status: 'loading',
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
            status: 'ready',
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
            status: 'error',
            items: [],
            total: 0,
            hasMore: false,
            nextCursor: null,
            isLoadingMore: false,
            error: err?.message ?? 'Не удалось загрузить примеры.',
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
              error: err?.message ?? 'Не удалось загрузить примеры.',
            },
          };
        });
      }
    },
    [auth.profile?.id, userExampleState],
  );

  const loadUserDictionaryDetails = useCallback(async (entryId: string, word: string) => {
    setUserDictionaryDetails((prev) => ({
      ...prev,
      [entryId]: { status: 'loading', translationsRu: [], synonyms: [] },
    }));

    try {
      const lang = detectLanguage(word) ? 'ru' : 'en';
      const entries = await dictionaryModuleApi.searchMueller({ word, lang });
      const primary = entries[0];
      const translationsRu = filterPureTranslations(primary?.translations ?? []).slice(0, 6);
      const synonyms = (primary?.synonyms ?? []).filter((value) => value && /[a-z]/i.test(value)).slice(0, 6);
      setUserDictionaryDetails((prev) => ({
        ...prev,
        [entryId]: {
          status: 'ready',
          translationsRu,
          synonyms,
        },
      }));
    } catch (err: any) {
      setUserDictionaryDetails((prev) => ({
        ...prev,
        [entryId]: {
          status: 'error',
          translationsRu: [],
          synonyms: [],
          error: err?.message ?? 'Не удалось загрузить переводы.',
        },
      }));
    }
  }, []);

  const toggleUserExamples = useCallback(
    (entryId: string, phrase: string) => {
      setExamplesOpen(false);
      setUserExamplesOpenId((prev) => {
        const nextValue = prev === entryId ? null : entryId;
        if (nextValue && userExampleState[entryId]?.status !== 'ready') {
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
        if (nextValue && userDictionaryDetails[nextValue]?.status !== 'ready') {
          const entry = (dictionary.items as UserDictionaryEntry[]).find(
            (item: UserDictionaryEntry) => item.id === nextValue,
          );
          if (entry) loadUserDictionaryDetails(entry.id, entry.word);
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
        {showBotBanner && (
          <div
            style={{
              background: "var(--tg-surface)",
              border: "1px solid var(--tg-border)",
              borderRadius: 16,
              padding: "12px 14px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, color: "var(--tg-text)" }}>
              Для корректной работы запустите бота.
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem('bot-started', '1');
                } catch {
                  // ignore
                }
                const url = "https://t.me/slothary_bot?start=from_webapp";
                if (webApp?.openTelegramLink) {
                  webApp.openTelegramLink(url);
                } else {
                  window.open(url, "_blank", "noopener,noreferrer");
                }
              }}
              style={{
                border: "none",
                background: "linear-gradient(135deg, #2ea3ff, #6dd3ff)",
                color: "#0c1021",
                fontWeight: 700,
                fontSize: 12,
                borderRadius: 999,
                padding: "8px 12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Запустить
            </button>
          </div>
        )}
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
          loading={status === 'loading'}
        />

        {helperText && <HelperText>{helperText}</HelperText>}

        {(status === 'loading' || dictStatus === 'loading') && (
          <LoaderWrap>
            <Loader />
          </LoaderWrap>
        )}

        {dictStatus === 'ready' && dictEntries.length > 0 &&
          (() => {
            const isRuQuery = detectLanguage(highlight);
            const primaryEntry = dictEntries[0];
            const ruTranslationsAll = filterPureTranslations(primaryEntry?.translations ?? []);
            const primaryEnglish = primaryEntry?.word?.trim() || query.trim();
            const primaryRussian = isRuQuery ? highlight.trim() : ruTranslationsAll[0] ?? '';
            const otherTranslationsRu = ruTranslationsAll.filter((value) => value && value !== primaryRussian).slice(0, 4);
            const synonymsAll = (primaryEntry?.synonyms ?? []).filter((value) => value && /[a-z]/i.test(value));
            const synonyms = synonymsAll.filter((value) => value !== primaryEnglish).slice(0, 4);
            const hasSnippets = items.length > 0;
            const showSnippets = showExamples && examplesOpen && hasSnippets;
            const normalizedWord = primaryEnglish.toLowerCase();
            const normalizedTranslation = primaryRussian.trim().toLowerCase();
            const existingEntry = (dictionary.items as UserDictionaryEntry[]).find(
              (entry: UserDictionaryEntry) =>
                entry.word.toLowerCase() === normalizedWord &&
                entry.translation.toLowerCase() === normalizedTranslation,
            );
            const isInDictionary = Boolean(existingEntry);
            const dictionaryActionLabel = isInDictionary ? 'в словаре' : '+ в словарь';

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
                dictionaryActionMode={isInDictionary ? 'tag' : 'button'}
                dictionaryActionDisabled={isInDictionary}
                onDictionaryAction={() => {
                  if (!auth.profile?.id) return;
                  if (isInDictionary && existingEntry) {
                    dispatch(removeWord(existingEntry.id));
                    return;
                  }
                  const lang = isRuQuery ? 'ru' : 'en';
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
                    showShareError(webApp, 'Откройте приложение через Telegram, чтобы поделиться.');
                    return;
                  }
                  if (isSharing) return;
                  const activeSnippet = items[activeIndex];
                  const exampleText =
                    activeSnippet?.contextText ||
                    activeSnippet?.matchedText ||
                    activeSnippet?.translationContextText ||
                    '';
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
                      webApp.showAlert('Сообщение отправлено в бот. Перешлите его нужному человеку.');
                    }
                  } catch (error: any) {
                    const message =
                      typeof error?.message === 'string'
                        ? `Не удалось отправить: ${error.message}`
                        : 'Не удалось отправить сообщение.';
                    showShareError(webApp, message);
                  } finally {
                    setIsSharing(false);
                  }
                }}
              >
                {showSnippets && (
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
                )}
              </WordCard>
            );
          })()}

        <DictionarySection>
          <SectionTitle>Мой словарь</SectionTitle>
          {(dictionary.items as UserDictionaryEntry[]).length === 0 && (
            <EmptyText>
              Здесь пока пусто. Добавляйте новые слова в словарь, и они будут появляться в этом списке.
            </EmptyText>
          )}
          <UserList>
            {(dictionary.items as UserDictionaryEntry[]).map((entry: UserDictionaryEntry) => {
              const open = userExamplesOpenId === entry.id;
              const state = userExampleState[entry.id] ?? {
                status: 'idle',
                items: [],
              };
              const expanded = userExpandedTranslationsId === entry.id;
              const otherTranslations = expanded ? entry.otherTranslations : undefined;
              const hasRuTranslations = expanded && Boolean(otherTranslations?.some((value) => detectLanguage(value)));
              const otherTranslationsRu = hasRuTranslations ? otherTranslations : undefined;
              const synonyms = expanded && !hasRuTranslations ? otherTranslations : undefined;
              const details = userDictionaryDetails[entry.id];
              const detailsTranslations = expanded && details?.status === 'ready' ? details.translationsRu : undefined;
              const detailsSynonyms = expanded && details?.status === 'ready' ? details.synonyms : undefined;

              return (
                <UserEntryWrapper key={entry.id}>
                  {expanded && (
                    <DeleteEntryButton
                      type='button'
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget({
                          id: entry.id,
                          word: entry.word,
                          translation: entry.translation,
                        });
                      }}
                      aria-label='Удалить'
                    >
                      <Icon name='close' size={14} />
                    </DeleteEntryButton>
                  )}

                  <Clickable
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest('button')) return;
                      toggleUserTranslations(entry.id);
                    }}
                  >
                    <WordCard
                      word={entry.word}
                      translation={entry.translation}
                      otherTranslationsRu={detailsTranslations ?? otherTranslationsRu}
                      synonyms={detailsSynonyms ?? synonyms}
                      showExamplesButton={expanded}
                      examplesOpen={open}
                      onToggleExamples={() => toggleUserExamples(entry.id, entry.word)}
                      dictionaryActionMode='none'
                      variant='compact'
                    >
                      {expanded && open && (
                        <>
                          {state.status === 'loading' && (
                            <InlineCenter>
                              <Loader />
                            </InlineCenter>
                          )}
                          {state.status === 'error' && <ErrorText>{state.error}</ErrorText>}
                          {state.status === 'ready' && state.items.length === 0 && (
                            <SubtleText>Примеры не найдены.</SubtleText>
                          )}
                          {state.items.length > 0 && (
                            <SnippetCarousel
                              items={state.items}
                              highlight={entry.word}
                              onOpenFullVideo={handleOpenFullVideo}
                              total={state.total}
                              hasMore={state.hasMore}
                              isLoadingMore={state.isLoadingMore}
                              onLoadMore={() => loadMoreUserExamples(entry.id, entry.word)}
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
        word={deleteTarget?.word ?? ''}
        translation={deleteTarget?.translation ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          dispatch(removeWord(deleteTarget.id));
          setDeleteTarget(null);
        }}
      />
    </PageShell>
  );
}
