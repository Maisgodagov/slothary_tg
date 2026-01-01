import { useEffect, useRef, useState } from "react";
import type { VideoCardProps } from "./types";
import { findChunkText } from "./utils";
import * as S from "./styles";
import { Icon } from "../../../../shared/ui/Icon";

export function VideoCard({
  item,
  contentState,
  onLoadContent,
  onLike,
  showOriginal,
  showTranslation,
  cardHeight,
  maxHeight,
  isActive,
  onVisibleChange,
  shouldLoad,
  onOpenSettings,
}: VideoCardProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [tapIndicator, setTapIndicator] = useState<"play" | "pause" | null>(
    null
  );
  const [isSeeking, setIsSeeking] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const tapTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldLoad) {
      onLoadContent();
    }
  }, [onLoadContent, shouldLoad]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          onVisibleChange(item.id, entry.intersectionRatio)
        );
      },
      { threshold: [0.5, 0.75, 0.9] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [item.id, onVisibleChange]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isActive) {
      el.play().catch(() => null);
    } else {
      el.pause();
    }
  }, [isActive]);

  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.muted = isMuted;
    }
  }, [isMuted]);

  const content = contentState.data;
  const enSub = showOriginal
    ? findChunkText(content?.transcription?.chunks, currentTime)
    : "";
  const ruSub = showTranslation
    ? findChunkText(content?.translation?.chunks, currentTime)
    : "";

  const handleTogglePlay = () => {
    const el = videoRef.current;
    if (!el) return;

    const willPlay = el.paused;
    if (willPlay) {
      el.play();
      setTapIndicator("play");
      if (tapTimeoutRef.current) {
        window.clearTimeout(tapTimeoutRef.current);
      }
      tapTimeoutRef.current = window.setTimeout(
        () => setTapIndicator(null),
        500
      );
    } else {
      el.pause();
      setTapIndicator("pause");
      if (tapTimeoutRef.current) {
        window.clearTimeout(tapTimeoutRef.current);
      }
      tapTimeoutRef.current = null;
    }
  };

  const handleSeek = (next: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = next;
    setCurrentTime(next);
  };

  const formatTime = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const subtitlesVisible = enSub || ruSub || contentState.loading;
  const likesCount = item.likesCount ?? content?.likesCount ?? 0;

  const tags: string[] = [];
  if (item.analysis?.cefrLevel) tags.push(item.analysis.cefrLevel);
  if (item.analysis?.speechSpeed) {
    const speed =
      item.analysis.speechSpeed === "slow"
        ? "Медленная речь"
        : item.analysis.speechSpeed === "fast"
        ? "Быстрая речь"
        : "Обычная скорость речи";
    tags.push(speed);
  }
  if (item.author) tags.push(item.author);
  if (item.isAdultContent) tags.push("18+");

  return (
    <S.Card ref={cardRef} $cardHeight={cardHeight} $maxHeight={maxHeight}>
      <S.Player
        ref={videoRef}
        src={shouldLoad ? item.videoUrl : undefined}
        playsInline
        autoPlay={false}
        muted={isMuted}
        preload={shouldLoad ? "metadata" : "none"}
        loop
        onClick={handleTogglePlay}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          const el = videoRef.current;
          if (!el) return;
          el.currentTime = 0;
          if (isActive) {
            el.play().catch(() => null);
          }
        }}
      />

      {tapIndicator && (
        <S.TapOverlay>
          <S.TapIndicator>
            <Icon
              name={tapIndicator === "play" ? "play" : "pause"}
              size={64}
              color="#fff"
            />
          </S.TapIndicator>
        </S.TapOverlay>
      )}

      <S.SettingsButton onClick={onOpenSettings}>
        <Icon name="more" size={20} />
      </S.SettingsButton>

      <S.TopRightStack>
        <S.IconButton
          onClick={() => {
            setIsMuted((v) => {
              const el = videoRef.current;
              if (el) el.muted = !v;
              return !v;
            });
          }}
        >
          <Icon
            name={isMuted ? "volume-off" : "volume-on"}
            size={30}
            color="#fff"
          />
        </S.IconButton>
      </S.TopRightStack>

      <S.LikeWrapper>
        <S.LikeButton onClick={() => onLike(item.id)}>
          <Icon
            name={item.isLiked ? "like" : "like-outline"}
            size={42}
            color={item.isLiked ? "#ff5f6d" : "#fff"}
          />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
            {likesCount}
          </span>
        </S.LikeButton>
      </S.LikeWrapper>

      <S.TagsRow>
        {tags.map((tag) => (
          <S.Badge key={tag}>{tag}</S.Badge>
        ))}
      </S.TagsRow>

      <S.Subtitles>
        {subtitlesVisible && (
          <div style={{ display: "grid", gap: 4, marginBottom: 4 }}>
            {contentState.loading && (
              <S.SubtitleLoading>Загружаем субтитры…</S.SubtitleLoading>
            )}
            {enSub && <S.SubtitleLine>{enSub}</S.SubtitleLine>}
            {ruSub && <S.SubtitleLine $secondary>{ruSub}</S.SubtitleLine>}
          </div>
        )}
      </S.Subtitles>

      {isActive && (
        <S.SeekContainer>
          {isSeeking && (
            <S.SeekTimes>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </S.SeekTimes>
          )}
          <S.Controls>
            <S.Progress
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                setIsSeeking(true);
                handleSeek(Number(e.target.value));
              }}
              onPointerDown={() => {
                setIsSeeking(true);
              }}
              onPointerUp={() => setIsSeeking(false)}
              onPointerMove={() => setIsSeeking(true)}
              onPointerCancel={() => setIsSeeking(false)}
              onPointerLeave={() => setIsSeeking(false)}
              onPointerOut={() => setIsSeeking(false)}
              onMouseDown={() => setIsSeeking(true)}
              onMouseUp={() => setIsSeeking(false)}
              onTouchStart={() => setIsSeeking(true)}
              onTouchEnd={() => setIsSeeking(false)}
              onBlur={() => setIsSeeking(false)}
              $thin
              $showThumb={isSeeking}
              style={{
                background: duration
                  ? `linear-gradient(90deg, #2ea3ff ${
                      (currentTime / duration) * 100
                    }%, #ffffff33 ${(currentTime / duration) * 100}%)`
                  : "#ffffff33",
              }}
            />
          </S.Controls>
        </S.SeekContainer>
      )}
    </S.Card>
  );
}
