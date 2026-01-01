import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { Loader } from "../../../../shared/ui/Loader";
import { selectAuth } from "../../../auth/slice";
import { loadFeed, selectVideoFeed, setFilters, toggleLike } from "../../slice";
import { videoFeedApi } from "../../api";
import type { VideoFeedItem } from "../../types";
import type { ContentState } from "./types";
import { VideoCard } from "./VideoCard";
import * as S from "./styles";

const NAV_OFFSET = 62;

export function VideoFeed() {
  const dispatch = useAppDispatch();
  const feed = useAppSelector(selectVideoFeed);
  const auth = useAppSelector(selectAuth);

  const showOriginal = feed.filters.showEnglishSubtitles;
  const showTranslation = feed.filters.showRussianSubtitles;

  const [contentMap, setContentMap] = useState<Record<string, ContentState>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastUserId = useRef<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(feed.filters);

  useEffect(() => {
    if (feed.items.length === 0) {
      dispatch(loadFeed({ reset: true }));
    }
  }, [feed.items.length, dispatch]);

  useEffect(() => {
    const currentUserId = auth.profile?.id ?? null;
    if (lastUserId.current === currentUserId) return;

    lastUserId.current = currentUserId;
    setContentMap({});
    setActiveId(null);
    dispatch(loadFeed({ reset: true }));
  }, [auth.profile?.id, dispatch]);

  useEffect(() => {
    if (activeId === null && feed.items.length > 0) {
      setActiveId(feed.items[0].id);
    }
  }, [feed.items.length, activeId]);

  const loadContent = useCallback(
    async (videoId: string) => {
      const state = contentMap[videoId];
      if (state?.loading || state?.data) return;

      setContentMap((prev) => ({
        ...prev,
        [videoId]: { ...prev[videoId], loading: true, error: undefined },
      }));

      try {
        const data = await videoFeedApi.getContent(auth.profile?.id ?? null, videoId, auth.profile?.role ?? null);
        setContentMap((prev) => ({
          ...prev,
          [videoId]: { data, loading: false, error: undefined },
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось загрузить видео";
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

  const cardHeight = `calc(100vh - var(--safe-bottom) - ${NAV_OFFSET}px)`;
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
  const activeIndex = useMemo(() => items.findIndex((i: VideoFeedItem) => i.id === activeId), [activeId, items]);

  return (
    <S.FeedContainer $navOffset={NAV_OFFSET}>
      {feed.status === "loading" && <Loader />}
      {feed.error && <S.ErrorText>{feed.error}</S.ErrorText>}

      <S.FeedScroll $navOffset={NAV_OFFSET}>
        {items.map((item, index) => {
          const isActive = activeId ? activeId === item.id : index === 0;
          const isNext = index === (activeIndex >= 0 ? activeIndex + 1 : 1);
          const shouldLoad = isActive || isNext;

          return (
            <VideoCard
              key={item.id}
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
            />
          );
        })}

        {feed.hasMore && <S.Sentinel ref={sentinelRef}>{isLoadingMore && <Loader />}</S.Sentinel>}
      </S.FeedScroll>

      {feed.hasMore && <S.HelperText>Прокручивайте вниз, лента подгружается автоматически</S.HelperText>}

      {settingsOpen && (
        <SettingsModal
          filters={tempFilters}
          onClose={() => setSettingsOpen(false)}
          onChangeFilters={setTempFilters}
          onSave={() => {
            setSettingsOpen(false);
            setContentMap({});
            setActiveId(null);
            dispatch(setFilters(tempFilters));
            dispatch(loadFeed({ reset: true }));
          }}
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
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10, color: "var(--tg-subtle)" }}>
        {title.toUpperCase()}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const isActive =
            (opt.value === null && selected === null) ||
            (opt.value !== null && selected !== null && opt.value.length === selected.length && opt.value.every((v, idx) => selected[idx] === v));
          return (
            <button
              key={opt.label}
              onClick={() => onSelect(opt.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 12,
                border: isActive ? "1px solid var(--tg-accent-strong)" : "1px solid var(--tg-border)",
                background: isActive ? "rgba(109, 211, 255, 0.18)" : "rgba(255,255,255,0.05)",
                color: isActive ? "var(--tg-text)" : "var(--tg-subtle)",
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

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 2px",
      }}
    >
      <div style={{ fontWeight: 700 }}>{label}</div>
      <label style={{ position: "relative", display: "inline-block", width: 48, height: 26, cursor: "pointer" }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: checked ? "var(--tg-accent-strong)" : "rgba(255,255,255,0.15)",
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
            boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
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
}: {
  filters: any;
  onClose: () => void;
  onChangeFilters: (updater: any) => void;
  onSave: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 20,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        padding: "0 12px calc(12px + var(--safe-bottom))",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#0f111a",
          borderRadius: 16,
          border: "1px solid var(--tg-border)",
          padding: "16px 16px 20px",
          color: "var(--tg-text)",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ width: 44, height: 4, background: "var(--tg-border)", borderRadius: 4, margin: "0 auto 14px" }} />

        <Section
          title="Уровень языка"
          options={[
            { label: "Все уровни", value: null },
            { label: "Начальный — A1", value: ["A1"] },
            { label: "Средний — A2, B1", value: ["A2", "B1"] },
            { label: "Высокий — B2, C1", value: ["B2", "C1"] },
          ]}
          selected={filters.cefrLevels}
          onSelect={(val) => onChangeFilters((p: any) => ({ ...p, cefrLevels: val }))}
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
          onSelect={(val) => onChangeFilters((p: any) => ({ ...p, speechSpeeds: val }))}
        />

        <div style={{ borderTop: "1px solid var(--tg-border)", margin: "16px 0", opacity: 0.7 }} />

        <ToggleRow
          label="Английские субтитры"
          checked={filters.showEnglishSubtitles}
          onChange={(v) => onChangeFilters((p: any) => ({ ...p, showEnglishSubtitles: v }))}
        />
        <ToggleRow
          label="Русские субтитры"
          checked={filters.showRussianSubtitles}
          onChange={(v) => onChangeFilters((p: any) => ({ ...p, showRussianSubtitles: v }))}
        />
        <ToggleRow
          label="Показывать 18+ видео"
          checked={filters.showAdultContent}
          onChange={(v) => onChangeFilters((p: any) => ({ ...p, showAdultContent: v }))}
        />

        <button
          onClick={onSave}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "14px 12px",
            borderRadius: 12,
            border: "none",
            background: "var(--tg-accent-strong)",
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
