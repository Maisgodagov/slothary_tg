import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { Loader } from "../../../../shared/ui/Loader";
import { selectAuth } from "../../../auth/slice";
import { initialFilters, loadFeed, selectVideoFeed, setFilters, toggleLike, upsertItem } from "../../slice";
import { videoFeedApi } from "../../api";
import type { VideoFeedItem } from "../../types";
import type { ContentState } from "./types";
import { VideoCard } from "./VideoCard";
import * as S from "./styles";
import { Icon } from "../../../../shared/ui/Icon";

const NAV_OFFSET = 38;

export function VideoFeed({ initialContentId }: { initialContentId?: string | null } = {}) {
  const dispatch = useAppDispatch();
  const feed = useAppSelector(selectVideoFeed);
  const auth = useAppSelector(selectAuth);

  const showOriginal = feed.filters.showEnglishSubtitles;
  const showTranslation = feed.filters.showRussianSubtitles;

  const [contentMap, setContentMap] = useState<Record<string, ContentState>>(
    {}
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastCursorRequested = useRef<string | null>(null);
  const lastUserId = useRef<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(feed.filters);
  const [showEndModal, setShowEndModal] = useState(false);
  const [exercisesOpen, setExercisesOpen] = useState(false);
  const pendingFocusId = useRef<string | null>(null);
  const feedScrollRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusFetchAttempted = useRef(false);

  const resolveUserId = useCallback(() => {
    if (auth.profile?.id) return auth.profile.id;
    try {
      const fromStorage = localStorage.getItem("guestUserId");
      if (fromStorage) return fromStorage;
      const newId = crypto.randomUUID();
      localStorage.setItem("guestUserId", newId);
      return newId;
    } catch {
      return `guest-${Math.random().toString(36).slice(2, 10)}`;
    }
  }, [auth.profile?.id]);

  useEffect(() => {
    if (!initialContentId) return;
    pendingFocusId.current = initialContentId;
  }, [initialContentId]);

  useEffect(() => {
    if (!initialContentId) return;
    if (focusFetchAttempted.current) return;
    if (feed.items.some((item) => item.id === initialContentId)) return;

    focusFetchAttempted.current = true;
    const userId = resolveUserId();
    const role = auth.profile?.role ?? null;

    videoFeedApi
      .getContent(userId, initialContentId, role)
      .then((content) => {
        const item = {
          id: content.id,
          videoName: content.videoName,
          videoUrl: content.videoUrl,
          durationSeconds: content.durationSeconds,
          analysis: content.analysis,
          status: "NOT_STARTED" as const,
          likesCount: content.likesCount,
          isLiked: content.isLiked,
          audioLevel: content.audioLevel,
          createdAt: content.createdAt,
          isAdultContent: content.isAdultContent,
          isModerated: content.isModerated,
          author: content.author ?? null,
        };
        dispatch(upsertItem(item));
      })
      .catch(() => {
        focusFetchAttempted.current = false;
      });
  }, [auth.profile?.role, dispatch, feed.items, initialContentId, resolveUserId]);

  useEffect(() => {
    if (settingsOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [settingsOpen]);

  useEffect(() => {
    if (feed.items.length === 0) {
      lastCursorRequested.current = null;
      dispatch(loadFeed({ reset: true }));
    }
  }, [feed.items.length, dispatch]);

  useEffect(() => {
    const currentUserId = auth.profile?.id ?? null;
    if (lastUserId.current === currentUserId) return;

    lastUserId.current = currentUserId;
    lastCursorRequested.current = null;
    setContentMap({});
    setActiveId(null);
    dispatch(loadFeed({ reset: true }));
  }, [auth.profile?.id, dispatch]);

  useEffect(() => {
    if (activeId === null && feed.items.length > 0) {
      setActiveId(feed.items[0].id);
    }
  }, [feed.items.length, activeId]);

  useEffect(() => {
    if (!pendingFocusId.current || feed.items.length === 0) return;
    const targetId = pendingFocusId.current;
    const node = cardRefs.current[targetId];
    if (!node) return;

    node.scrollIntoView({ behavior: "auto", block: "start" });
    setActiveId(targetId);
    pendingFocusId.current = null;
  }, [feed.items]);

  const loadContent = useCallback(
    async (videoId: string) => {
      const state = contentMap[videoId];
      if (state?.loading || state?.data) return;

      setContentMap((prev) => ({
        ...prev,
        [videoId]: { ...prev[videoId], loading: true, error: undefined },
      }));

      try {
        const data = await videoFeedApi.getContent(
          auth.profile?.id ?? null,
          videoId,
          auth.profile?.role ?? null
        );
        setContentMap((prev) => ({
          ...prev,
          [videoId]: { data, loading: false, error: undefined },
        }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Не удалось загрузить видео";
        setContentMap((prev) => ({
          ...prev,
          [videoId]: {
            data: prev[videoId]?.data,
            loading: false,
            error: message,
          },
        }));
      }
    },
    [auth.profile?.id, auth.profile?.role, contentMap]
  );

  const toggleLikeHandler = useCallback(
    (id: string) => {
      dispatch(toggleLike(id));
    },
    [dispatch]
  );

  const cardHeight = `calc(var(--app-height, 100vh) - var(--tg-content-safe-area-inset-top) - var(--tg-content-safe-area-inset-bottom) - ${NAV_OFFSET}px)`;
  const maxHeight = cardHeight;

  const handleVisibleChange = useCallback((id: string, ratio: number) => {
    if (ratio >= 0.65) {
      setActiveId(id);
    }
  }, []);

  const isLoadingMore = feed.status === "refreshing";

  useEffect(() => {
    if (!sentinelRef.current || !feed.hasMore) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoadingMore) {
            dispatch(loadFeed({ reset: false }));
          }
        });
      },
      { root: null, threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [dispatch, feed.hasMore, isLoadingMore]);

  const items = feed.items;
  const activeIndex = useMemo(
    () => items.findIndex((i: VideoFeedItem) => i.id === activeId),
    [activeId, items]
  );

  useEffect(() => {
    if (
      feed.hasMore &&
      feed.status === "idle" &&
      items.length > 0 &&
      activeIndex >= items.length - 2
    ) {
      if (lastCursorRequested.current === feed.cursor) return;
      lastCursorRequested.current = feed.cursor;
      dispatch(loadFeed({ reset: false }));
    }
  }, [activeIndex, items.length, feed.hasMore, feed.status, feed.cursor, dispatch]);

  useEffect(() => {
    if (
      !feed.hasMore &&
      feed.status === "idle" &&
      items.length > 0 &&
      activeIndex >= items.length - 1
    ) {
      setShowEndModal(true);
    }
  }, [feed.hasMore, feed.status, items.length, activeIndex]);

  return (
    <S.FeedContainer $navOffset={NAV_OFFSET}>
      {feed.status === "loading" && <Loader />}
      {feed.error && <S.ErrorText>{feed.error}</S.ErrorText>}

      {items.length === 0 && feed.status === "idle" ? (
        <S.EmptyState>
          <S.EmptyTitle>Видео по текущим фильтрам закончились</S.EmptyTitle>
          <S.EmptyText>Поменяйте параметры или сбросьте фильтры, чтобы продолжить.</S.EmptyText>
          <S.EmptyButton
            onClick={() => {
              setTempFilters(initialFilters);
              dispatch(setFilters(initialFilters));
              dispatch(loadFeed({ reset: true }));
            }}
          >
            Сбросить фильтры
          </S.EmptyButton>
        </S.EmptyState>
      ) : (
        <S.FeedScroll
          ref={feedScrollRef}
          $navOffset={NAV_OFFSET}
          $locked={exercisesOpen}
        >
          {items.map((item, index) => {
            const isActive = activeId ? activeId === item.id : index === 0;
            const isNext = index === (activeIndex >= 0 ? activeIndex + 1 : 1);
            const shouldLoad = isActive || isNext;

            return (
              <div
                key={item.id}
                ref={(node) => {
                  cardRefs.current[item.id] = node;
                }}
              >
                <VideoCard
                  item={item}
                  contentState={contentMap[item.id] ?? {}}
                  onLoadContent={() => loadContent(item.id)}
                  onLike={toggleLikeHandler}
                  showOriginal={showOriginal}
                  showTranslation={showTranslation}
                  cardHeight={cardHeight}
                  maxHeight={maxHeight}
                  isActive={isActive}
                  onVisibleChange={handleVisibleChange}
                  shouldLoad={shouldLoad}
                  onOpenSettings={() => {
                    setTempFilters(feed.filters);
                    setSettingsOpen(true);
                  }}
                  onExercisesToggle={(open) => setExercisesOpen(open)}
                />
              </div>
            );
          })}

          {feed.hasMore && (
            <S.Sentinel ref={sentinelRef}>
              {isLoadingMore && <Loader />}
            </S.Sentinel>
          )}
        </S.FeedScroll>
      )}

      {showEndModal && (
        <S.ModalBackdrop
          onClick={() => {
            setShowEndModal(false);
          }}
        >
          <S.ModalCard onClick={(e) => e.stopPropagation()}>
            <S.ModalTitle>Видео по фильтрам закончились</S.ModalTitle>
            <S.ModalText>
              Измените параметры подбора или сбросьте фильтры, чтобы продолжить просмотр.
            </S.ModalText>
            <S.ModalActions>
              <S.ModalButton onClick={() => setShowEndModal(false)}>Закрыть</S.ModalButton>
              <S.ModalButton
                $primary
                onClick={() => {
                  setShowEndModal(false);
                  setTempFilters(initialFilters);
                  setContentMap({});
                  setActiveId(null);
                  dispatch(setFilters(initialFilters));
                  dispatch(loadFeed({ reset: true }));
                }}
              >
                Сбросить фильтры
              </S.ModalButton>
            </S.ModalActions>
          </S.ModalCard>
        </S.ModalBackdrop>
      )}

      {settingsOpen && (
        <SettingsModal
          filters={tempFilters}
          onClose={() => setSettingsOpen(false)}
          onChangeFilters={setTempFilters}
          onSave={() => {
            setSettingsOpen(false);
            setContentMap({});
            setActiveId(null);
            lastCursorRequested.current = null;
            dispatch(setFilters(tempFilters));
            dispatch(loadFeed({ reset: true }));
          }}
          isAdmin={auth.profile?.role === "admin"}
        />
      )}
    </S.FeedContainer>
  );
}

interface SectionOption {
  label: string;
  value: string[] | null;
}

function Section({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: SectionOption[];
  selected: string[] | null;
  onSelect: (val: string[] | null) => void;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0.5,
          marginBottom: 12,
          color: "var(--tg-subtle, #cfd5e4)",
        }}
      >
        {title.toUpperCase()}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {options.map((opt) => {
          const isActive =
            (opt.value === null && selected === null) ||
            (opt.value !== null &&
              selected !== null &&
              opt.value.length === selected.length &&
              opt.value.every((v, idx) => selected[idx] === v));
          return (
            <button
              key={opt.label}
              onClick={() => onSelect(opt.value)}
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                border: "none",
                background: isActive
                  ? "#3c4f70"
                  : "var(--tg-card, #1f273b)",
                color: "var(--tg-text, #e9edf7)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 2px",
        marginBottom: 8,
      }}
    >
      <div style={{ fontWeight: 700 }}>{label}</div>
      <label
        style={{
          position: "relative",
          display: "inline-block",
          width: 48,
          height: 26,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: checked ? "#0f7aa7" : "#d0d5dc",
            borderRadius: 26,
            transition: "0.2s",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: checked ? 24 : 4,
            top: 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            transition: "0.2s",
          }}
        />
      </label>
    </div>
  );
}

function SettingsModal({
  filters,
  onClose,
  onChangeFilters,
  onSave,
  isAdmin,
}: {
  filters: any;
  onClose: () => void;
  onChangeFilters: (updater: any) => void;
  onSave: () => void;
  isAdmin: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9998,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 14px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 720,
          background: "var(--tg-surface, #0f1428)",
          borderRadius: 20,
          border: "1px solid var(--tg-border, #2b3245)",
          padding: "22px 20px 26px",
          color: "var(--tg-text, #e9edf7)",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.45)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 12,
            border: "1px solid var(--tg-border, #2b3245)",
            background: "var(--tg-card, #1f273b)",
            color: "var(--tg-text, #e9edf7)",
            cursor: "pointer",
          }}
          aria-label="Закрыть"
        >
          <Icon name="close" size={20} />
        </button>
        <div
          style={{
            width: 44,
            height: 4,
            background: "var(--tg-border, #2b3245)",
            borderRadius: 4,
            margin: "0 auto 20px",
          }}
        />

        <Section
          title="Уровень языка"
          options={[
            { label: "Все уровни", value: null },
            { label: "Начальный — A1", value: ["A1"] },
            { label: "Средний — A2, B1", value: ["A2", "B1"] },
            { label: "Высокий — B2, C1", value: ["B2", "C1"] },
          ]}
          selected={filters.cefrLevels}
          onSelect={(val) =>
            onChangeFilters((p: any) => ({ ...p, cefrLevels: val }))
          }
        />

        <Section
          title="Скорость речи"
          options={[
            { label: "Любая скорость", value: null },
            { label: "Медленная речь", value: ["slow"] },
            { label: "Обычная скорость речи", value: ["normal"] },
            { label: "Быстрая речь", value: ["fast"] },
          ]}
          selected={filters.speechSpeeds}
          onSelect={(val) =>
            onChangeFilters((p: any) => ({ ...p, speechSpeeds: val }))
          }
        />

        <div
          style={{
            borderTop: "1px solid var(--tg-border, #2b3245)",
            margin: "18px 0",
            opacity: 1,
          }}
        />

        <ToggleRow
          label="Английские субтитры"
          checked={filters.showEnglishSubtitles}
          onChange={(v) =>
            onChangeFilters((p: any) => ({ ...p, showEnglishSubtitles: v }))
          }
        />
        <ToggleRow
          label="Русские субтитры"
          checked={filters.showRussianSubtitles}
          onChange={(v) =>
            onChangeFilters((p: any) => ({ ...p, showRussianSubtitles: v }))
          }
        />
        <ToggleRow
          label="Показывать 18+ видео"
          checked={filters.showAdultContent}
          onChange={(v) =>
            onChangeFilters((p: any) => ({ ...p, showAdultContent: v }))
          }
        />

        {isAdmin && (
          <Section
            title="Модерация"
            options={[
              { label: "Все", value: null },
              { label: "Промодерированные", value: ["moderated"] },
              { label: "Не промодерированные", value: ["unmoderated"] },
            ]}
            selected={
              filters.moderationFilter ? [filters.moderationFilter] : null
            }
            onSelect={(val) =>
              onChangeFilters((p: any) => ({
                ...p,
                moderationFilter: val ? (val[0] as any) : null,
              }))
            }
          />
        )}

        <button
          onClick={onSave}
          style={{
            width: "100%",
            marginTop: 18,
            padding: "14px 12px",
            borderRadius: 12,
            border: "none",
            background: "#0f7aa7",
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}
