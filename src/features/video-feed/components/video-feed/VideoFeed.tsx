import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { Loader } from "../../../../shared/ui/Loader";
import { selectAuth } from "../../../auth/slice";
import { loadFeed, selectVideoFeed, toggleLike } from "../../slice";
import { videoFeedApi } from "../../api";
import type { VideoFeedItem } from "../../types";
import type { ContentState } from "./types";
import { VideoCard } from "./VideoCard";
import * as S from "./styles";

const NAV_OFFSET = 68;

export function VideoFeed() {
  const dispatch = useAppDispatch();
  const feed = useAppSelector(selectVideoFeed);
  const auth = useAppSelector(selectAuth);

  const showOriginal = true;
  const showTranslation = true;

  const [contentMap, setContentMap] = useState<Record<string, ContentState>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastUserId = useRef<string | null>(null);

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
  const activeIndex = useMemo(
    () => items.findIndex((i: VideoFeedItem) => i.id === activeId),
    [activeId, items]
  );

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
            />
          );
        })}

        {feed.hasMore && (
          <S.Sentinel ref={sentinelRef}>{isLoadingMore && <Loader />}</S.Sentinel>
        )}
      </S.FeedScroll>

      {feed.hasMore && (
        <S.HelperText>Прокручивайте вниз, лента подгружается автоматически</S.HelperText>
      )}
    </S.FeedContainer>
  );
}
