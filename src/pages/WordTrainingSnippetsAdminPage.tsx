import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAppSelector } from '../app/hooks';
import { selectAuth } from '../features/auth/slice';
import {
  type ModerationSnippet,
  type ModerationWordItem,
  wordTrainingSnippetsAdminApi,
} from '../features/admin/wordTrainingSnippetsApi';
import type { PhraseSnippet } from '../features/video-dictionary/api';
import { SnippetCard } from '../modules/dictionary/components/SnippetCard';
import { Button } from '../shared/ui/Button';
import { PageShell } from '../shared/ui/PageShell';

type FilterMode = 'all' | 'moderated' | 'unmoderated';

const toSnippet = (word: string, snippet: ModerationSnippet): PhraseSnippet => ({
  id: `${snippet.contentId}-${snippet.startSeconds}-${snippet.endSeconds}`,
  contentId: String(snippet.contentId),
  videoName: snippet.videoName || `Video #${snippet.contentId}`,
  videoUrl: snippet.videoUrl ?? '',
  startSeconds: snippet.startSeconds,
  endSeconds: snippet.endSeconds,
  matchedText: snippet.matchedText || word,
  contextText: snippet.contextText || '',
  phrase: word,
  durationSeconds: null,
});

const snippetKey = (item: {
  contentId: number;
  startSeconds: number;
  endSeconds: number;
}) => `${item.contentId}:${item.startSeconds.toFixed(3)}:${item.endSeconds.toFixed(3)}`;

const PAGE_SIZE = 30;

export default function WordTrainingSnippetsAdminPage() {
  const auth = useAppSelector(selectAuth);
  const role = auth.profile?.role ?? null;
  const isAdmin = role === 'admin';

  const [filter, setFilter] = useState<FilterMode>('unmoderated');
  const [search, setSearch] = useState('');
  const [words, setWords] = useState<ModerationWordItem[]>([]);
  const [wordsTotal, setWordsTotal] = useState(0);
  const [wordOffset, setWordOffset] = useState(0);
  const [loadingWords, setLoadingWords] = useState(false);
  const [selectedWord, setSelectedWord] = useState<ModerationWordItem | null>(null);

  const [snippets, setSnippets] = useState<ModerationSnippet[]>([]);
  const [selectedSnippetKeys, setSelectedSnippetKeys] = useState<Set<string>>(new Set());
  const [loadingSnippets, setLoadingSnippets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const firstCardRef = useRef<HTMLDivElement | null>(null);
  const cardWidthRef = useRef(0);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollRaf = useRef<number | null>(null);
  const scrollEndTimer = useRef<number | null>(null);
  const lastSettledIndex = useRef(0);

  const loadWords = async (offset = 0, replace = true) => {
    if (!isAdmin) return;
    setLoadingWords(true);
    setError(null);
    try {
      const result = await wordTrainingSnippetsAdminApi.listWords(
        {
          limit: PAGE_SIZE,
          offset,
          filter,
          search: search.trim() || undefined,
        },
        role,
      );
      setWordsTotal(result.total);
      setWordOffset(result.offset);
      setWords((prev) => (replace ? result.items : [...prev, ...result.items]));

      if (!selectedWord && result.items.length > 0) {
        setSelectedWord(result.items[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить слова');
    } finally {
      setLoadingWords(false);
    }
  };

  const loadSnippets = async (word: ModerationWordItem | null) => {
    if (!isAdmin || !word) return;
    setLoadingSnippets(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await wordTrainingSnippetsAdminApi.getWordSnippets(
        word.yandexCacheId,
        { limit: 24, paddingSeconds: 1 },
        role,
      );
      setSnippets(result.snippets);
      setSelectedSnippetKeys(
        new Set(result.snippets.filter((snippet) => snippet.checked).map((snippet) => snippetKey(snippet))),
      );
      setActiveIndex(0);
      cardRefs.current = [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить сниппеты');
      setSnippets([]);
      setSelectedSnippetKeys(new Set());
      setActiveIndex(0);
      cardRefs.current = [];
    } finally {
      setLoadingSnippets(false);
    }
  };

  useEffect(() => {
    void loadWords(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, role, filter]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadWords(0, true);
    }, 280);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    void loadSnippets(selectedWord);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWord?.yandexCacheId]);

  const getClosestIndex = useCallback(() => {
    const container = sliderRef.current;
    if (!container || snippets.length === 0) return 0;

    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < snippets.length; index += 1) {
      const card = cardRefs.current[index];
      if (!card) continue;
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - centerX);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    }

    return closestIndex;
  }, [snippets.length]);

  const settleToIndex = useCallback((index: number) => {
    const card = cardRefs.current[index];
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, []);

  const updateCardWidth = useCallback(() => {
    if (!firstCardRef.current) return;
    const width = firstCardRef.current.getBoundingClientRect().width;
    cardWidthRef.current = width;
    sliderRef.current?.style.setProperty('--card-width', `${width}px`);
  }, []);

  useEffect(() => {
    if (!firstCardRef.current || snippets.length === 0) return;
    updateCardWidth();
    const observer = new ResizeObserver(() => updateCardWidth());
    observer.observe(firstCardRef.current);
    return () => observer.disconnect();
  }, [snippets.length, updateCardWidth]);

  useEffect(() => {
    if (!sliderRef.current || snippets.length === 0) return;
    requestAnimationFrame(() => {
      updateCardWidth();
      const target = Math.min(lastSettledIndex.current, snippets.length - 1);
      settleToIndex(target);
      setActiveIndex(target);
    });
  }, [snippets.length, settleToIndex, updateCardWidth]);

  useEffect(() => {
    const node = sliderRef.current;
    if (!node || snippets.length === 0) return;

    const handleScroll = () => {
      if (scrollRaf.current) {
        window.cancelAnimationFrame(scrollRaf.current);
      }
      scrollRaf.current = window.requestAnimationFrame(() => {
        const nextIndex = getClosestIndex();
        setActiveIndex(nextIndex);
      });

      if (scrollEndTimer.current) {
        window.clearTimeout(scrollEndTimer.current);
      }
      scrollEndTimer.current = window.setTimeout(() => {
        const settled = getClosestIndex();
        lastSettledIndex.current = settled;
        setActiveIndex(settled);
        settleToIndex(settled);
      }, 130);
    };

    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      node.removeEventListener('scroll', handleScroll);
      if (scrollRaf.current) {
        window.cancelAnimationFrame(scrollRaf.current);
        scrollRaf.current = null;
      }
      if (scrollEndTimer.current) {
        window.clearTimeout(scrollEndTimer.current);
        scrollEndTimer.current = null;
      }
    };
  }, [getClosestIndex, settleToIndex, snippets.length]);

  useEffect(() => {
    if (activeIndex >= snippets.length && snippets.length > 0) {
      setActiveIndex(snippets.length - 1);
    }
  }, [activeIndex, snippets.length]);

  useEffect(() => {
    if (snippets.length === 0) {
      lastSettledIndex.current = 0;
      return;
    }
    lastSettledIndex.current = Math.min(activeIndex, snippets.length - 1);
  }, [activeIndex, snippets.length]);

  const selectedCount = selectedSnippetKeys.size;
  const canLoadMoreWords = words.length < wordsTotal;

  const snippetsWithState = useMemo(
    () =>
      snippets.map((snippet) => ({
        snippet,
        key: snippetKey(snippet),
        checked: selectedSnippetKeys.has(snippetKey(snippet)),
      })),
    [selectedSnippetKeys, snippets],
  );

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={{ padding: 16, color: 'var(--tg-subtle)' }}>
          {'Доступно только для администратора.'}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={{ padding: 12, paddingBottom: 70, display: 'grid', gap: 12 }}>
        <div className="page-header" style={{ fontSize: 18, fontWeight: 700 }}>
          {'Предпочтительные сниппеты'}
        </div>

        <div className="section" style={{ display: 'grid', gap: 8 }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск слова"
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant={filter === 'unmoderated' ? 'primary' : 'ghost'} onClick={() => setFilter('unmoderated')}>
              {'Не отмодерированные'}
            </Button>
            <Button variant={filter === 'moderated' ? 'primary' : 'ghost'} onClick={() => setFilter('moderated')}>
              {'Отмодерированные'}
            </Button>
            <Button variant={filter === 'all' ? 'primary' : 'ghost'} onClick={() => setFilter('all')}>
              {'Все'}
            </Button>
          </div>
          {loadingWords && <div style={{ color: 'var(--tg-subtle)' }}>{'Загрузка слов...'}</div>}
          {!loadingWords && (
            <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflow: 'auto' }}>
              {words.map((word) => (
                <button
                  key={word.yandexCacheId}
                  type="button"
                  onClick={() => setSelectedWord(word)}
                  style={{
                    ...wordItemStyle,
                    borderColor:
                      selectedWord?.yandexCacheId === word.yandexCacheId
                        ? 'rgba(76,196,255,0.7)'
                        : 'var(--tg-border)',
                  }}
                >
                  <span>{word.query}</span>
                  <span style={{ color: word.isModerated ? '#2ecc71' : 'var(--tg-subtle)', fontSize: 12 }}>
                    {word.isModerated ? `✓ ${word.selectedCount}` : '—'}
                  </span>
                </button>
              ))}
              {words.length === 0 && <div style={{ color: 'var(--tg-subtle)' }}>{'Слова не найдены.'}</div>}
            </div>
          )}
          {canLoadMoreWords && (
            <Button variant="ghost" onClick={() => void loadWords(wordOffset + PAGE_SIZE, false)} disabled={loadingWords}>
              {'Показать еще'}
            </Button>
          )}
        </div>

        {selectedWord && (
          <div className="section" style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>{selectedWord.query}</div>
              <div style={{ color: 'var(--tg-subtle)', fontSize: 13 }}>
                {'Выбрано: '}{selectedCount}
              </div>
            </div>

            {loadingSnippets && <div style={{ color: 'var(--tg-subtle)' }}>{'Загрузка сниппетов...'}</div>}
            {!loadingSnippets && snippets.length === 0 && (
              <div style={{ color: 'var(--tg-subtle)' }}>{'Сниппеты не найдены.'}</div>
            )}

            {!loadingSnippets && snippets.length > 0 && (
              <>
                <div
                  ref={sliderRef}
                  className="video-dict-slider"
                  style={{
                    display: 'flex',
                    gap: 20,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: 'auto',
                    paddingTop: 4,
                    paddingBottom: 4,
                    paddingLeft: 'calc((100% - var(--card-width, 320px)) / 2)',
                    paddingRight: 'calc((100% - var(--card-width, 320px)) / 2)',
                  }}
                >
                  {snippetsWithState.map(({ snippet, key, checked }, index) => {
                    const isActive = index === activeIndex;
                    const shouldRender = Math.abs(index - activeIndex) <= 1;
                    return (
                      <div
                        key={key}
                        ref={(node) => {
                          cardRefs.current[index] = node;
                          if (index === 0) firstCardRef.current = node;
                        }}
                        style={{
                          width: 320,
                          maxWidth: '88vw',
                          flex: '0 0 auto',
                          scrollSnapAlign: 'center',
                          scrollSnapStop: 'always',
                          opacity: isActive ? 1 : 0.78,
                          transform: isActive ? 'scale(1)' : 'scale(0.985)',
                          transition: 'opacity 180ms ease, transform 180ms ease',
                          display: 'grid',
                          gap: 8,
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              const next = new Set(selectedSnippetKeys);
                              if (event.target.checked) next.add(key);
                              else next.delete(key);
                              setSelectedSnippetKeys(next);
                            }}
                          />
                          {'Использовать в упражнениях'}
                        </label>
                        <SnippetCard
                          snippet={toSnippet(selectedWord.query, snippet)}
                          isActive={isActive}
                          shouldRender={shouldRender}
                          compact
                          loop={false}
                          highlight={selectedWord.query}
                          onOpenFullVideo={() => undefined}
                        />
                      </div>
                    );
                  })}
                </div>
                <div style={{ textAlign: 'center', color: 'var(--tg-subtle)', fontSize: 13 }}>
                  {`${Math.min(activeIndex + 1, snippets.length)}/${snippets.length}`}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                onClick={async () => {
                  if (!selectedWord) return;
                  setSaving(true);
                  setError(null);
                  setSuccess(null);
                  try {
                    const selected = snippetsWithState
                      .filter((row) => selectedSnippetKeys.has(row.key))
                      .map(({ snippet }) => ({
                        contentId: snippet.contentId,
                        startSeconds: snippet.startSeconds,
                        endSeconds: snippet.endSeconds,
                        matchedText: snippet.matchedText,
                        contextText: snippet.contextText,
                      }));
                    const result = await wordTrainingSnippetsAdminApi.saveWordSnippets(
                      selectedWord.yandexCacheId,
                      selected,
                      role,
                    );
                    setSuccess(`Сохранено: ${result.selectedCount}`);
                    setWords((prev) =>
                      prev.map((item) =>
                        item.yandexCacheId === selectedWord.yandexCacheId
                          ? {
                              ...item,
                              selectedCount: result.selectedCount,
                              isModerated: result.selectedCount > 0,
                            }
                          : item,
                      ),
                    );
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Не удалось сохранить');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {'Сохранить выбор'}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setSelectedSnippetKeys(
                    new Set(snippets.filter((snippet) => snippet.checked).map((snippet) => snippetKey(snippet))),
                  )
                }
                disabled={saving}
              >
                {'Сбросить'}
              </Button>
            </div>
          </div>
        )}

        {error && <div style={{ color: 'var(--tg-danger)' }}>{error}</div>}
        {success && <div style={{ color: 'var(--tg-success)' }}>{success}</div>}
      </div>
    </PageShell>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid var(--tg-border)',
  background: 'var(--tg-surface)',
  color: 'var(--tg-text)',
  padding: '10px 12px',
  fontSize: 14,
};

const wordItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  borderRadius: 10,
  border: '1px solid var(--tg-border)',
  background: 'var(--tg-card)',
  color: 'var(--tg-text)',
  padding: '8px 10px',
  textAlign: 'left',
};
