import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { selectAuth, setProfile } from "../../../auth/slice";
import {
  addWord,
  removeWord,
  selectDictionary,
} from "../../../dictionary/slice";
import { dictionaryApi } from "../../../dictionary/api";
import { muellerApi, type MuellerEntry } from "../../../mueller/api";
import { wordIdsFromSubtitles } from "../../../exercises/lib/wordIds";
import { exercisesApi, type ExerciseItem } from "../../../exercises/api";
import { usersApi } from "../../../users/api";
import type { SpeechSpeedFilter } from "../../slice";
import { moderationApi } from "../../moderationApi";
import type { VideoCardProps } from "./types";
import * as S from "./styles";
import { Icon } from "../../../../shared/ui/Icon";
import { Loader } from "../../../../shared/ui/Loader";
import { WordCard } from "../../../dictionary/components/WordCard";

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
  // onOpenSettings,
  onOpenLevelFilter,
  // selectedLevelFilters,
  onOpenSpeedFilter,
  // selectedSpeedFilters,
  onExercisesToggle,
  registerRef,
}: VideoCardProps) {
  const content = contentState.data;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [exercises, setExercises] = useState<ExerciseItem[] | null>(null);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [exerciseOptions, setExerciseOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const lastTapRef = useRef<number>(0);
  const playTimeoutRef = useRef<number | null>(null);
  const heartTimeoutRef = useRef<number | null>(null);
  const [heartIndicator, setHeartIndicator] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [savingModeration, setSavingModeration] = useState(false);
  const [authors, setAuthors] = useState<string[]>([]);
  const [subtitleModal, setSubtitleModal] = useState(false);
  const [enEdit, setEnEdit] = useState("");
  const [ruEdit, setRuEdit] = useState("");
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number | null>(
    null
  );
  const [authorModal, setAuthorModal] = useState<string | null>(null);
  const [subtitleLookup, setSubtitleLookup] = useState<{
    word: string;
    status: "idle" | "loading" | "ready" | "error";
    entry?: MuellerEntry;
    error?: string;
  } | null>(null);
  const [subtitlePopover, setSubtitlePopover] = useState<{
    top: number;
    left: number;
    width: number;
    placement: "top" | "bottom";
  } | null>(null);
  const [localTranscription, setLocalTranscription] = useState(
    content?.transcription?.chunks ?? []
  );
  const [localTranslation, setLocalTranslation] = useState(
    content?.translation?.chunks ?? []
  );
  const wordChunks = content?.transcription?.wordChunks ?? [];
  const auth = useAppSelector(selectAuth);
  const dictionary = useAppSelector(selectDictionary);
  const dispatch = useAppDispatch();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const tapTimeoutRef = useRef<number | null>(null);
  const exercisesRequested = useRef(false);
  const subtitleWasPlayingRef = useRef(false);
  const subtitleForcePlayRef = useRef(false);
  const resolveUserId = () => {
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
  };

  useEffect(() => {
    setLocalTranscription(content?.transcription?.chunks ?? []);
    setLocalTranslation(content?.translation?.chunks ?? []);
  }, [content?.transcription?.chunks, content?.translation?.chunks]);

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
      el.play()
        .then(() => setIsPaused(false))
        .catch(() => null);
    } else {
      el.pause();
      setIsPaused(true);
    }
  }, [isActive]);

  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) window.clearTimeout(playTimeoutRef.current);
      if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current);
      if (heartTimeoutRef.current) window.clearTimeout(heartTimeoutRef.current);
    };
  }, []);

  const findChunkWithIndex = (
    chunks: { text: string; timestamp: [number, number] }[] | undefined,
    graceSeconds = 1.5
  ) => {
    if (!chunks || !chunks.length) return { text: "", index: -1 };
    const activeIdx = chunks.findIndex(
      (ch) => currentTime >= ch.timestamp[0] && currentTime < ch.timestamp[1]
    );
    if (activeIdx !== -1)
      return { text: chunks[activeIdx].text, index: activeIdx };

    // If in pause, keep previous chunk visible for a short grace period
    let lastIdx = -1;
    for (let i = 0; i < chunks.length; i++) {
      if (currentTime >= chunks[i].timestamp[0]) lastIdx = i;
      else break;
    }
    if (lastIdx === -1) return { text: "", index: -1 };

    const last = chunks[lastIdx];
    if (currentTime <= last.timestamp[1] + graceSeconds) {
      return { text: last.text, index: lastIdx };
    }

    return { text: "", index: -1 };
  };

  const { text: enSub, index: enIndex } = showOriginal
    ? findChunkWithIndex(localTranscription)
    : { text: "", index: -1 };
  const { text: ruSub, index: ruIndex } = showTranslation
    ? findChunkWithIndex(localTranslation)
    : { text: "", index: -1 };

  const handleTogglePlay = () => {
    const el = videoRef.current;
    if (!el) return;

    const willPlay = el.paused;
    if (willPlay) {
      el.play();
      setIsPaused(false);
    } else {
      el.pause();
      setIsPaused(true);
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

  const handleTap = () => {
    if (subtitlePopover) return;
    if (showExercises) {
      setShowExercises(false);
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (playTimeoutRef.current) {
        window.clearTimeout(playTimeoutRef.current);
        playTimeoutRef.current = null;
      }
      onLike(item.id);
      lastTapRef.current = 0;
      setHeartIndicator(true);
      if (heartTimeoutRef.current) {
        window.clearTimeout(heartTimeoutRef.current);
      }
      heartTimeoutRef.current = window.setTimeout(
        () => setHeartIndicator(false),
        550
      );
      return;
    }
    lastTapRef.current = now;
    if (playTimeoutRef.current) {
      window.clearTimeout(playTimeoutRef.current);
    }
    playTimeoutRef.current = window.setTimeout(() => {
      handleTogglePlay();
      playTimeoutRef.current = null;
    }, 300);
  };

  const subtitlesVisible = enSub || ruSub || contentState.loading;

  useEffect(() => {
    setSubtitleLookup(null);
    setSubtitlePopover(null);
  }, [enSub, ruSub]);

  useEffect(() => {
    if (isActive) return;
    setSubtitlePopover(null);
    setSubtitleLookup(null);
    subtitleWasPlayingRef.current = false;
    subtitleForcePlayRef.current = false;
  }, [isActive]);

  useEffect(() => {
    setSubtitlePopover(null);
    setSubtitleLookup(null);
    subtitleWasPlayingRef.current = false;
    subtitleForcePlayRef.current = false;
  }, [item.id]);

  useEffect(() => {
    if (subtitlePopover) return;
    const shouldResume = subtitleWasPlayingRef.current;
    const forcePlay = subtitleForcePlayRef.current;
    subtitleWasPlayingRef.current = false;
    subtitleForcePlayRef.current = false;
    if (!shouldResume && !forcePlay) return;
    const video = videoRef.current;
    if (video && video.paused) {
      video.play().catch(() => undefined);
    }
  }, [subtitlePopover]);

  useEffect(() => {
    if (!subtitlePopover) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-subtitle-popover]")) return;
      const video = videoRef.current;
      if (video && target.closest("video")) {
        subtitleForcePlayRef.current = true;
      }
      setSubtitlePopover(null);
      setSubtitleLookup(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [subtitlePopover]);

  useEffect(() => {
    if (!subtitlePopover) return;
    const handleScroll = () => {
      setSubtitlePopover(null);
      setSubtitleLookup(null);
    };
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("touchmove", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("touchmove", handleScroll);
    };
  }, [subtitlePopover]);

  const englishTokens = useMemo(() => {
    if (!enSub) return [];
    const parts = enSub.match(/([A-Za-z']+|[^A-Za-z']+)/g) ?? [];
    return parts.map((part, index) => ({
      value: part,
      isWord: /^[A-Za-z']+$/.test(part),
      key: `${part}-${index}`,
    }));
  }, [enSub]);

  const handleSubtitleWordClick = async (word: string, rect: DOMRect) => {
    const normalized = word.toLowerCase();
    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    // const minWidth = 160;
    const popoverWidth = Math.min(280, viewportWidth * 0.88);
    const margin = 12;
    const centeredLeft = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      viewportWidth - margin - popoverWidth / 2,
      Math.max(margin + popoverWidth / 2, centeredLeft)
    );
    const estimatedHeight = 200;
    let placement: "top" | "bottom" = "top";
    if (rect.top < estimatedHeight + margin) placement = "bottom";
    if (
      placement === "bottom" &&
      rect.bottom + estimatedHeight + margin > viewportHeight
    ) {
      placement = "top";
    }
    const top = placement === "top" ? rect.top - 8 : rect.bottom + 8;
    const video = videoRef.current;
    if (video && !video.paused) {
      subtitleWasPlayingRef.current = true;
      video.pause();
    }
    setSubtitlePopover({
      top,
      left: clampedLeft,
      width: popoverWidth,
      placement,
    });
    setSubtitleLookup({ word: normalized, status: "loading" });
    try {
      const entries = await muellerApi.lookup({ word: normalized, lang: "en" });
      setSubtitleLookup({
        word: normalized,
        status: "ready",
        entry: entries[0],
      });
      const primary = entries[0];
      if (primary?.word && primary.translations?.[0]) {
        dictionaryApi
          .recordView(resolveUserId(), {
            query: normalized,
            lang: "en",
            word: primary.word,
            translation: primary.translations[0],
          })
          .catch(() => null);
      }
    } catch (err: any) {
      setSubtitleLookup({
        word: normalized,
        status: "error",
        error: err?.message ?? "Не удалось загрузить перевод.",
      });
    }
  };

  const likesCount = item.likesCount ?? content?.likesCount ?? 0;

  const contentAnalysis = content?.analysis ?? item.analysis;
  const speedLabel = (value: SpeechSpeedFilter | null | undefined) => {
    if (!value) return null;
    if (value === "slow") return "Медленная речь";
    if (value === "fast") return "Быстрая речь";
    return "Обычная скорость речи";
  };

  const tags: {
    label: string;
    type: "author" | "level" | "speed" | "plain";
  }[] = [];
  const currentLevel =
    contentAnalysis?.cefrLevel ?? item.analysis?.cefrLevel ?? null;
  if (currentLevel) {
    tags.push({ label: currentLevel, type: "level" });
  }
  const currentSpeed = (contentAnalysis?.speechSpeed ??
    item.analysis?.speechSpeed ??
    null) as SpeechSpeedFilter | null;
  if (currentSpeed) {
    const speedText = speedLabel(currentSpeed);
    if (speedText) {
      tags.push({ label: speedText, type: "speed" });
    }
  }
  if (item.author) tags.push({ label: item.author, type: "author" });
  if (item.isAdultContent) tags.push({ label: "18+", type: "plain" });

  const subtitlesSource = localTranscription;
  const isContentLoading =
    contentState.loading || (!contentState.data && shouldLoad);
  const currentExercise =
    exercises && exerciseIndex < exercises.length
      ? exercises[exerciseIndex]
      : null;
  const shuffleOptions = (input: string[]) => {
    const arr = [...input];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const exerciseText = (value?: string | null) => {
    if (!value) return "";
    return value.split(",")[0]?.trim() ?? value;
  };
  const exerciseWord = currentExercise
    ? exerciseText(currentExercise.word || currentExercise.prompt)
    : "";
  const exerciseTranslation = currentExercise?.correctAnswer ?? "";
  const exerciseInDictionary = Boolean(
    currentExercise &&
      dictionary.items.find(
        (item) =>
          item.word.toLowerCase() === exerciseWord.toLowerCase() &&
          item.translation.toLowerCase() === exerciseTranslation.toLowerCase()
      )
  );
  const exercisesCount = exercises?.length ?? 0;
  const isAdmin = auth.profile?.role === "admin";
  const handleExerciseTouchCapture = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    if (!showExercises) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-exercise-scroll]")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };
  const handleExerciseWheelCapture = (
    event: React.WheelEvent<HTMLDivElement>
  ) => {
    if (!showExercises) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-exercise-scroll]")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };
  const initialCefr = contentAnalysis?.cefrLevel ?? "A2";
  const initialSpeech = contentAnalysis?.speechSpeed ?? "normal";
  const initialAuthor = content?.author ?? item.author ?? "";
  const initialAdult = content?.isAdultContent ?? item.isAdultContent ?? false;
  const initialModerated = content?.isModerated ?? item.isModerated ?? false;
  const [cefr, setCefr] = useState(initialCefr);
  const [speech, setSpeech] = useState(initialSpeech);
  const [author, setAuthor] = useState(initialAuthor);
  const [isAdult, setIsAdult] = useState(initialAdult);
  const [isModerated, setIsModerated] = useState(initialModerated);

  useEffect(() => {
    const loadExercises = async () => {
      if (exercisesRequested.current || exercisesLoading || exercises) return;
      if (!contentState.data) return;
      if (!subtitlesSource.length) return;
      exercisesRequested.current = true;
      try {
        setExercisesLoading(true);
        const wordIds = await wordIdsFromSubtitles(subtitlesSource as any, {
          limit: 120,
        });
        if (!wordIds.length) {
          setExercises([]);
          return;
        }
        // const exercisesRole = "admin";
        const { exercises: data } = await exercisesApi.getExercises(
          { wordIds, exerciseLimit: 30, wordLimit: 20 },
          resolveUserId()
          // exercisesRole
        );
        setExercises(data ?? []);
        setExerciseIndex(0);
        setSelectedOption(null);
      } catch (err) {
        console.error("Failed to load exercises", err);
        setExercises([]);
      } finally {
        setExercisesLoading(false);
      }
    };
    loadExercises();
  }, [
    contentState.data,
    subtitlesSource,
    exercisesLoading,
    exercises,
    auth.profile?.id,
  ]);

  useEffect(() => {
    if (!showModeration || !isAdmin) return;
    const loadAuthors = async () => {
      try {
        const list = await moderationApi.getAuthors(
          auth.profile?.id,
          auth.profile?.role
        );
        setAuthors(list?.map((a) => a.username) ?? []);
      } catch (err) {
        console.error("Failed to load authors", err);
      }
    };
    loadAuthors();
  }, [showModeration, isAdmin, auth.profile?.id, auth.profile?.role]);

  useEffect(() => {
    setCefr(initialCefr);
    setSpeech(initialSpeech);
    setAuthor(initialAuthor);
    setIsAdult(initialAdult);
    setIsModerated(initialModerated);
  }, [
    initialAdult,
    initialAuthor,
    initialCefr,
    initialModerated,
    initialSpeech,
  ]);

  const handleOptionSelect = async (option: string) => {
    if (!currentExercise) return;
    if (selectedOption) return;
    const correct = option === currentExercise.correctAnswer;
    setSelectedOption(option);
    if (auth.profile?.id) {
      exercisesApi
        .submitAnswer(
          { wordId: currentExercise.wordId, isCorrect: correct },
          auth.profile.id
        )
        .catch((err) => console.error("submitAnswer failed", err));
      if (correct) {
        usersApi
          .addXp(XP_PER_CORRECT_ANSWER, auth.profile.id)
          .then((result) => {
            dispatch(
              setProfile({
                ...auth.profile!,
                xpPoints: result.xpPoints,
              })
            );
          })
          .catch((err) => console.error("addXp failed", err));
      }
    }
    setTimeout(() => {
      setSelectedOption(null);
      setExerciseIndex((idx) => idx + 1);
    }, 800);
  };

  const showSpinner = isContentLoading;
  const showExerciseButton = !showSpinner && exercisesCount > 0;

  useEffect(() => {
    if (!currentExercise) {
      setExerciseOptions([]);
      return;
    }
    const correct = currentExercise.correctAnswer;
    const pool = Array.from(new Set(currentExercise.options));
    const candidates = pool.filter((item) => item !== correct);
    const picked = shuffleOptions(candidates).slice(0, 2);
    const next = shuffleOptions([correct, ...picked]);
    while (next.length < 3) next.push(correct);
    setExerciseOptions(next);
  }, [currentExercise?.wordId, currentExercise?.correctAnswer, currentExercise?.options]);


  const findWordTimestamp = (
    word: string,
    chunks: { text: string; timestamp: [number, number] }[]
  ) => {
    if (!word) return null;
    const lower = word.toLowerCase();
    for (const ch of chunks) {
      if (ch.text.toLowerCase() === lower) return ch.timestamp[0];
    }
    return null;
  };

  useEffect(() => {
    if (onExercisesToggle) onExercisesToggle(showExercises);
  }, [showExercises, onExercisesToggle]);

  return (
    <S.Card
      ref={(node) => {
        cardRef.current = node;
        if (registerRef) registerRef(node);
      }}
      $cardHeight={cardHeight}
      $maxHeight={maxHeight}
    >
      <S.Player
        ref={videoRef}
        src={shouldLoad ? item.videoUrl : undefined}
        playsInline
        autoPlay={false}
        muted={isMuted}
        preload={shouldLoad ? "metadata" : "none"}
        loop
        $shrink={showExercises}
        onClick={handleTap}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setIsPaused(false)}
        onPause={() => setIsPaused(true)}
        onEnded={() => {
          const el = videoRef.current;
          if (!el) return;
          el.currentTime = 0;
          el.play().catch(() => null);
        }}
      />

      {showSpinner && (
        <S.SpinnerOverlay>
          <Loader />
        </S.SpinnerOverlay>
      )}

      {isPaused && !showSpinner && (
        <S.TapOverlay $shrink={showExercises}>
          <S.TapIndicator>
            <Icon name="play" size={showExercises ? 48 : 64} color="#fff" />
          </S.TapIndicator>
        </S.TapOverlay>
      )}

      {heartIndicator && (
        <S.TapOverlay $shrink={showExercises}>
          <S.TapIndicator>
            <Icon name="like" size={72} color="#ff5f6d" fillColor="#ff5f6d" />
          </S.TapIndicator>
        </S.TapOverlay>
      )}

      {!showSpinner && !showExercises && (
        <S.TopRightStack $withSheet={showExercises}>
          <S.LikeButton onClick={() => onLike(item.id)}>
            <Icon
              name={item.isLiked ? "like" : "like-outline"}
              size={34}
              color={item.isLiked ? "#ff5f6d" : "#fff"}
              fillColor={item.isLiked ? "#ff5f6d" : "none"}
            />
            <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
              {likesCount}
            </span>
          </S.LikeButton>
          {showExerciseButton && (
            <S.ExerciseButton onClick={() => setShowExercises((v) => !v)}>
              <Icon name="exercise" size={34} color="#fff" />
              <span>{exercisesCount}</span>
            </S.ExerciseButton>
          )}
          {isAdmin && (
            <S.ModerationButton
              onClick={() => setShowModeration(true)}
              $approved={isModerated}
            >
              <Icon
                name="admin"
                size={30}
                color={isModerated ? "#3ec985" : "#fff"}
              />
            </S.ModerationButton>
          )}
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
      )}
      {!showSpinner && !showExercises && (
        <S.TagsRow>
          {tags.map((tag) => {
            if (tag.type === "author") {
              return (
                <S.Badge
                  key={tag.label}
                  as="button"
                  type="button"
                  onClick={() => setAuthorModal(tag.label)}
                  style={{
                    cursor: "pointer",
                    border: "none",
                    outline: "none",
                    padding: "8px 12px",
                  }}
                >
                  {tag.label}
                </S.Badge>
              );
            }
            if (tag.type === "level") {
              return (
                <S.Badge
                  key={tag.label}
                  as="button"
                  type="button"
                  onClick={() => onOpenLevelFilter?.(currentLevel)}
                  style={{
                    cursor: "pointer",
                    border: "none",
                    outline: "none",
                    padding: "8px 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{tag.label}</span>
                  <Icon
                    name="chevron-down"
                    size={18}
                    color="#fff"
                    style={{ flexShrink: 0 }}
                  />
                </S.Badge>
              );
            }
            if (tag.type === "speed") {
              return (
                <S.Badge
                  key={tag.label}
                  as="button"
                  type="button"
                  onClick={() => onOpenSpeedFilter?.(currentSpeed)}
                  style={{
                    cursor: "pointer",
                    border: "none",
                    outline: "none",
                    padding: "8px 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{tag.label}</span>
                  <Icon
                    name="chevron-down"
                    size={18}
                    color="#fff"
                    style={{ flexShrink: 0 }}
                  />
                </S.Badge>
              );
            }
            return <S.Badge key={tag.label}>{tag.label}</S.Badge>;
          })}
        </S.TagsRow>
      )}

      {!showSpinner && (
        <S.Subtitles $withSheet={showExercises}>
          {subtitlesVisible && (
            <div
              style={{
                display: "grid",
                gap: 3,
                marginBottom: 4,
                pointerEvents: "auto",
              }}
            >
              {contentState.loading && (
                <S.SubtitleLoading>Загружаем субтитры...</S.SubtitleLoading>
              )}
              {enSub && (
                <S.SubtitleLine style={{ fontSize: showExercises ? 18 : 18 }}>
                  {englishTokens.map((token) =>
                    token.isWord ? (
                      <button
                        key={token.key}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          const rect = (
                            event.currentTarget as HTMLElement
                          ).getBoundingClientRect();
                          handleSubtitleWordClick(token.value, rect);
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          margin: 0,
                          color: "inherit",
                          font: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        {token.value}
                      </button>
                    ) : (
                      <span key={token.key}>{token.value}</span>
                    )
                  )}
                </S.SubtitleLine>
              )}
              {!showExercises && ruSub && (
                <S.SubtitleLine $secondary>{ruSub}</S.SubtitleLine>
              )}
            </div>
          )}
          {isAdmin && enIndex >= 0 && ruIndex >= 0 && (
            <S.EditSubtitleButton
              onClick={(e) => {
                e.stopPropagation();
                setCurrentChunkIndex(enIndex);
                setEnEdit(enSub || "");
                setRuEdit(ruSub || "");
                setSubtitleModal(true);
              }}
            >
              <Icon name="edit" size={18} color="#fff" />
            </S.EditSubtitleButton>
          )}
        </S.Subtitles>
      )}

      {subtitlePopover && (
        <div
          data-subtitle-popover
          style={{
            position: "fixed",
            left: subtitlePopover.left,
            top: subtitlePopover.top,
            transform:
              subtitlePopover.placement === "top"
                ? "translate(-50%, -100%)"
                : "translate(-50%, 0)",
            zIndex: 10000,
            width: "max-content",
            maxWidth: `${subtitlePopover.width}px`,
            minWidth: "160px",
            pointerEvents: "auto",
            fontFamily: "inherit",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {subtitleLookup?.status === "loading" && (
            <div
              style={{
                background: "var(--tg-surface)",
                border: "1px solid var(--tg-border)",
                borderRadius: 14,
                padding: 12,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Loader />
            </div>
          )}
          {subtitleLookup?.status === "error" && (
            <div
              style={{
                background: "var(--tg-surface)",
                border: "1px solid var(--tg-border)",
                borderRadius: 14,
                padding: 12,
                color: "var(--tg-danger)",
                fontSize: 13,
              }}
            >
              {subtitleLookup.error}
            </div>
          )}
          {subtitleLookup?.status === "ready" &&
            subtitleLookup.entry &&
            (() => {
              const entry = subtitleLookup.entry;
              const translation =
                entry.translations.find((value) => value.trim().length > 0) ??
                "";
              const otherTranslations = entry.translations
                .filter((value) => value && value !== translation)
                .slice(0, 4);
              const normalizedWord = entry.word.toLowerCase();
              const normalizedTranslation = translation.toLowerCase();
              const existingEntry = dictionary.items.find(
                (item) =>
                  item.word.toLowerCase() === normalizedWord &&
                  item.translation.toLowerCase() === normalizedTranslation
              );
              const isInDictionary = Boolean(existingEntry);
              const dictionaryActionLabel = isInDictionary
                ? "в словаре"
                : "+ в словарь";

              return (
                <WordCard
                  word={entry.word}
                  translation={translation}
                  otherTranslationsRu={otherTranslations}
                  showExamplesButton={false}
                  examplesOpen={false}
                  onToggleExamples={() => undefined}
                  dictionaryActionLabel={dictionaryActionLabel}
                  dictionaryActionMode={isInDictionary ? "tag" : "button"}
                  dictionaryActionDisabled={isInDictionary}
                  onDictionaryAction={() => {
                    if (!auth.profile?.id) return;
                    if (isInDictionary && existingEntry) {
                      dispatch(removeWord(existingEntry.id));
                      return;
                    }
                    dispatch(
                      addWord({
                        query: normalizedWord,
                        lang: "en",
                        word: entry.word,
                        translation,
                      })
                    );
                  }}
                  variant="compact"
                  size="subtitle"
                />
              );
            })()}
        </div>
      )}

      {isActive && !showExercises && !showSpinner && (
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

      {isActive && (
        <S.ExerciseSheet
          $open={showExercises}
          onTouchStartCapture={handleExerciseTouchCapture}
          onTouchMoveCapture={handleExerciseTouchCapture}
          onWheelCapture={handleExerciseWheelCapture}
        >
          <S.ExerciseHandle />
          {exercisesLoading && (
            <S.ExercisePlaceholder>
              Загружаем упражнения...
            </S.ExercisePlaceholder>
          )}
          {!exercisesLoading && currentExercise && (
            <S.ExerciseList data-exercise-scroll>
                <S.ExerciseCard>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <S.ExercisePrompt>
                      {exerciseText(currentExercise.prompt)}
                    </S.ExercisePrompt>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          const word = exerciseWord;
                          const translation = exerciseTranslation;
                          if (!word || !translation) return;
                          if (exerciseInDictionary) return;
                          const normalizedWord = word.toLowerCase();
                          const payload = {
                            query: normalizedWord,
                            lang: "en" as const,
                            word,
                            translation,
                          };
                        if (auth.profile?.id) {
                          dispatch(addWord(payload));
                        } else {
                          dictionaryApi
                            .addUserDictionaryEntry(resolveUserId(), payload)
                            .catch((err) =>
                              console.error("addUserDictionaryEntry failed", err)
                            );
                        }
                      }}
                      style={{
                        border: "1px solid var(--tg-border)",
                        background: "var(--tg-card)",
                        color: "var(--tg-text)",
                        fontWeight: 700,
                        fontSize: 12,
                        borderRadius: 999,
                        padding: "6px 10px",
                        cursor: exerciseInDictionary ? "default" : "pointer",
                        whiteSpace: "nowrap",
                        opacity: exerciseInDictionary ? 0.6 : 1,
                      }}
                      disabled={exerciseInDictionary}
                    >
                      {exerciseInDictionary ? "в словаре" : "+ в словарь"}
                    </button>
                      {currentExercise.direction === "en-ru" && (
                        <S.ListenButton
                          onClick={() => {
                            const lookupWord = exerciseText(
                              currentExercise.word || currentExercise.prompt
                            );
                            const ts = findWordTimestamp(lookupWord, wordChunks);
                            if (ts === null) return;
                            const el = videoRef.current;
                            if (!el) return;
                            el.currentTime = ts;
                            el.play().catch(() => null);
                          }}
                        >
                          <Icon name="volume-on" size={18} />
                        </S.ListenButton>
                      )}
                    </div>
                </div>
                  <S.ExerciseOptions>
                    {exerciseOptions.map((opt, i) => {
                    const state =
                      selectedOption === null
                        ? "neutral"
                        : opt === currentExercise.correctAnswer
                        ? "correct"
                        : opt === selectedOption
                        ? "wrong"
                        : "neutral";
                    return (
                      <S.ExerciseOption
                        key={i}
                        $state={state as any}
                        onClick={() => handleOptionSelect(opt)}
                        disabled={selectedOption !== null}
                      >
                        {exerciseText(opt)}
                      </S.ExerciseOption>
                    );
                  })}
                </S.ExerciseOptions>
              </S.ExerciseCard>
            </S.ExerciseList>
          )}
          {!exercisesLoading && !currentExercise && (
            <S.ExercisePlaceholder>
              Больше упражнений для этого видео нет.
            </S.ExercisePlaceholder>
          )}
        </S.ExerciseSheet>
      )}
      {isActive && (
        <S.ExerciseOverlay
          $open={showExercises}
          onClick={() => setShowExercises(false)}
          onTouchStart={(event) => {
            if (!showExercises) return;
            event.preventDefault();
            event.stopPropagation();
          }}
          onTouchMove={(event) => {
            if (!showExercises) return;
            event.preventDefault();
            event.stopPropagation();
          }}
          onWheel={(event) => {
            if (!showExercises) return;
            event.preventDefault();
            event.stopPropagation();
          }}
        />
      )}

      {showModeration && isAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 640,
              background: "#ffffff",
              border: "1px solid #e6e8ef",
              borderRadius: 20,
              padding: "22px 20px 26px",
              color: "#1a1d29",
              boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 44,
                height: 4,
                background: "#d9dce3",
                borderRadius: 4,
                margin: "0 auto 18px",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  Модерация видео
                </div>
                <div style={{ fontSize: 12, color: "#6a6f7a" }}>
                  ID: {item.id}
                </div>
              </div>
              <button
                onClick={() => setShowModeration(false)}
                style={{
                  border: "1px solid #e6e8ef",
                  background: "#f5f6fa",
                  color: "#404658",
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  borderRadius: 12,
                }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <label style={labelStyle}>
                Уровень языка
                <select
                  value={cefr}
                  onChange={(e) => setCefr(e.target.value as any)}
                  style={inputStyle}
                >
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Скорость речи
                <select
                  value={speech}
                  onChange={(e) => setSpeech(e.target.value as any)}
                  style={inputStyle}
                >
                  <option value="slow">Медленная речь</option>
                  <option value="normal">Обычная скорость речи</option>
                  <option value="fast">Быстрая речь</option>
                </select>
              </label>

              <label style={labelStyle}>
                Автор видео
                <input
                  list="author-list"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  style={inputStyle}
                  placeholder="@author"
                />
                <datalist id="author-list">
                  {authors.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </label>

              <ToggleRow
                label="18+ контент"
                checked={isAdult}
                onChange={setIsAdult}
              />
              <ToggleRow
                label="Видео прошло модерацию"
                checked={isModerated}
                onChange={setIsModerated}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={async () => {
                  if (!auth.profile?.id) return;
                  if (!window.confirm("Удалить это видео?")) return;
                  try {
                    setSavingModeration(true);
                    await moderationApi.deleteVideo(
                      item.id,
                      auth.profile.id,
                      auth.profile.role
                    );
                    setShowModeration(false);
                  } catch (err) {
                    console.error("Delete video failed", err);
                    alert("Не удалось удалить видео");
                  } finally {
                    setSavingModeration(false);
                  }
                }}
                style={{
                  ...buttonStyle,
                  background: "linear-gradient(135deg, #ff5f6d, #ff9966)",
                  color: "#0c1021",
                }}
              >
                Удалить
              </button>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flex: 1,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowModeration(false)}
                  style={{
                    ...buttonStyle,
                    background: "#f5f6fa",
                    border: "1px solid #d8dadd",
                    color: "#1a1d29",
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={async () => {
                    if (!auth.profile?.id) return;
                    try {
                      setSavingModeration(true);
                      const requests: Promise<unknown>[] = [];
                      if (cefr !== initialCefr) {
                        requests.push(
                          moderationApi.updateCefrLevel(
                            item.id,
                            cefr,
                            auth.profile.id,
                            auth.profile.role
                          )
                        );
                      }
                      if (speech !== initialSpeech) {
                        requests.push(
                          moderationApi.updateSpeechSpeed(
                            item.id,
                            speech,
                            auth.profile.id,
                            auth.profile.role
                          )
                        );
                      }
                      if (author !== initialAuthor) {
                        requests.push(
                          moderationApi.updateAuthor(
                            item.id,
                            author,
                            auth.profile.id,
                            auth.profile.role
                          )
                        );
                      }
                      if (isAdult !== initialAdult) {
                        requests.push(
                          moderationApi.updateAdult(
                            item.id,
                            isAdult,
                            auth.profile.id,
                            auth.profile.role
                          )
                        );
                      }
                      if (isModerated !== initialModerated) {
                        requests.push(
                          moderationApi.updateModerationStatus(
                            item.id,
                            isModerated,
                            auth.profile.id,
                            auth.profile.role
                          )
                        );
                      }
                      await Promise.all(requests);
                      setShowModeration(false);
                    } catch (err) {
                      console.error("Save moderation failed", err);
                      alert("Не удалось сохранить");
                    } finally {
                      setSavingModeration(false);
                    }
                  }}
                  style={{
                    ...buttonStyle,
                    background: "#0f7aa7",
                    color: "#fff",
                    minWidth: 120,
                  }}
                  disabled={savingModeration}
                >
                  {savingModeration ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {subtitleModal && isAdmin && currentChunkIndex !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 12,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#0f1428",
              border: "1px solid var(--tg-border)",
              borderRadius: 16,
              padding: 16,
              color: "var(--tg-text)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  Редактировать субтитры
                </div>
                <div style={{ fontSize: 12, color: "var(--tg-subtle)" }}>
                  Таймкод:{" "}
                  {localTranscription[currentChunkIndex]
                    ? `${localTranscription[
                        currentChunkIndex
                      ].timestamp[0].toFixed(2)} - ${localTranscription[
                        currentChunkIndex
                      ].timestamp[1].toFixed(2)}`
                    : ""}
                </div>
              </div>
              <button
                onClick={() => setSubtitleModal(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--tg-subtle)",
                  cursor: "pointer",
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <label style={labelStyle}>
                Английские субтитры
                <textarea
                  style={textareaStyle}
                  rows={3}
                  value={enEdit}
                  onChange={(e) => setEnEdit(e.target.value)}
                />
              </label>

              <label style={labelStyle}>
                Русские субтитры
                <textarea
                  style={textareaStyle}
                  rows={3}
                  value={ruEdit}
                  onChange={(e) => setRuEdit(e.target.value)}
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setSubtitleModal(false)}
                style={{
                  ...buttonStyle,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--tg-border)",
                  color: "#fff",
                }}
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  if (!auth.profile?.id || currentChunkIndex === null) return;
                  const transcriptChunk = localTranscription[currentChunkIndex];
                  const translationChunk = localTranslation[currentChunkIndex];
                  if (!transcriptChunk || !translationChunk) return;
                  try {
                    setSavingModeration(true);
                    await moderationApi.updateSubtitleChunk(
                      item.id,
                      {
                        chunkIndex: currentChunkIndex,
                        transcript: { ...transcriptChunk, text: enEdit },
                        translation: { ...translationChunk, text: ruEdit },
                      },
                      auth.profile.id,
                      auth.profile.role
                    );
                    const nextTrans = [...localTranscription];
                    const nextRu = [...localTranslation];
                    nextTrans[currentChunkIndex] = {
                      ...transcriptChunk,
                      text: enEdit,
                    };
                    nextRu[currentChunkIndex] = {
                      ...translationChunk,
                      text: ruEdit,
                    };
                    setLocalTranscription(nextTrans);
                    setLocalTranslation(nextRu);
                    setSubtitleModal(false);
                  } catch (err) {
                    console.error("Failed to save subtitles", err);
                    alert("Не удалось сохранить субтитры");
                  } finally {
                    setSavingModeration(false);
                  }
                }}
                style={{
                  ...buttonStyle,
                  background: "linear-gradient(135deg, #2ea3ff, #6dd3ff)",
                  color: "#0c1021",
                  minWidth: 120,
                }}
                disabled={savingModeration}
              >
                {savingModeration ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {authorModal && (
        <S.ModalBackdrop onClick={() => setAuthorModal(null)}>
          <S.ModalCard onClick={(e) => e.stopPropagation()}>
            <S.ModalClose onClick={() => setAuthorModal(null)}>×</S.ModalClose>
            <S.ModalTitle>Авторское право</S.ModalTitle>
            <S.ModalText>
              Все права на видеоматериал принадлежат его законному автору. Ролик
              получен из открытых источников и используется исключительно в
              образовательных и ознакомительных целях.
            </S.ModalText>
            <S.ModalActions>
              <S.ModalButton
                as="a"
                href={`https://www.tiktok.com/${
                  authorModal.startsWith("@") ? authorModal : `@${authorModal}`
                }`}
                target="_blank"
                rel="noreferrer"
                $primary
                style={{ textDecoration: "none" }}
              >
                Перейти к автору (
                {authorModal.startsWith("@") ? authorModal : `@${authorModal}`})
              </S.ModalButton>
            </S.ModalActions>
          </S.ModalCard>
        </S.ModalBackdrop>
      )}
    </S.Card>
  );
}

const XP_PER_CORRECT_ANSWER = 10;

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--tg-border)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--tg-text)",
  padding: "10px 12px",
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
};

const buttonStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "none",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 80,
  resize: "vertical",
};

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
    <label
      style={{
        ...labelStyle,
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontWeight: 700, color: "#1a1d29" }}>{label}</span>
      <span
        style={{
          position: "relative",
          display: "inline-block",
          width: 48,
          height: 26,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
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
      </span>
    </label>
  );
}
