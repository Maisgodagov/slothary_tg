import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../../app/hooks";
import { selectAuth } from "../../../auth/slice";
import { wordIdsFromSubtitles } from "../../../exercises/lib/wordIds";
import { exercisesApi, type ExerciseItem } from "../../../exercises/api";
import { moderationApi } from "../../moderationApi";
import type { VideoCardProps } from "./types";
import * as S from "./styles";
import { Icon } from "../../../../shared/ui/Icon";
import { Loader } from "../../../../shared/ui/Loader";

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
  const content = contentState.data;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [tapIndicator, setTapIndicator] = useState<"play" | "pause" | null>(
    null
  );
  const [isSeeking, setIsSeeking] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [exercises, setExercises] = useState<ExerciseItem[] | null>(null);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);
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
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number | null>(null);
  const [localTranscription, setLocalTranscription] = useState(
    content?.transcription?.chunks ?? []
  );
  const [localTranslation, setLocalTranslation] = useState(
    content?.translation?.chunks ?? []
  );
  const wordChunks = content?.transcription?.wordChunks ?? [];
  const auth = useAppSelector(selectAuth);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const tapTimeoutRef = useRef<number | null>(null);
  const exercisesRequested = useRef(false);

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
    if (activeIdx !== -1) return { text: chunks[activeIdx].text, index: activeIdx };

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

  const handleTap = () => {
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

  const subtitlesSource = localTranscription;
  const currentExercise =
    exercises && exerciseIndex < exercises.length ? exercises[exerciseIndex] : null;
  const exercisesCount = exercises?.length ?? 0;
  const isAdmin = auth.profile?.role === "admin";
  const contentAnalysis = content?.analysis ?? item.analysis;
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
        const wordIds = await wordIdsFromSubtitles(subtitlesSource as any, { limit: 120 });
        if (!wordIds.length) {
          setExercises([]);
          return;
        }
        const { exercises: data } = await exercisesApi.getExercises(
          { wordIds, exerciseLimit: 10, wordLimit: 20 },
          auth.profile?.id
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
  }, [contentState.data, subtitlesSource, exercisesLoading, exercises, auth.profile?.id]);

  useEffect(() => {
    if (!showModeration || !isAdmin) return;
    const loadAuthors = async () => {
      try {
        const list = await moderationApi.getAuthors(auth.profile?.id, auth.profile?.role);
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
  }, [initialAdult, initialAuthor, initialCefr, initialModerated, initialSpeech]);

  const handleOptionSelect = async (option: string) => {
    if (!currentExercise) return;
    if (selectedOption) return;
    const correct = option === currentExercise.correctAnswer;
    setSelectedOption(option);
    if (auth.profile?.id) {
      exercisesApi
        .submitAnswer({ wordId: currentExercise.wordId, isCorrect: correct }, auth.profile.id)
        .catch((err) => console.error("submitAnswer failed", err));
    }
    setTimeout(() => {
      setSelectedOption(null);
      setExerciseIndex((idx) => idx + 1);
    }, 800);
  };

  const showSpinner =
    contentState.loading || (exercisesLoading && (!exercises || exercises.length === 0));
  const showExerciseButton = !showSpinner && exercisesCount > 0;

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
        $shrink={showExercises}
        onClick={handleTap}
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

      {showSpinner && (
        <S.SpinnerOverlay>
          <Loader />
        </S.SpinnerOverlay>
      )}

      {tapIndicator && !showSpinner && (
        <S.TapOverlay $shrink={showExercises}>
          <S.TapIndicator>
            <Icon
              name={tapIndicator === "play" ? "play" : "pause"}
              size={showExercises ? 48 : 64}
              color="#fff"
            />
          </S.TapIndicator>
        </S.TapOverlay>
      )}

      {heartIndicator && (
        <S.TapOverlay $shrink={showExercises}>
          <S.TapIndicator>
            <Icon name="like" size={72} color="#ff5f6d" />
          </S.TapIndicator>
        </S.TapOverlay>
      )}

      {!showExercises && (
        <S.SettingsButton onClick={onOpenSettings}>
          <Icon name="more" size={20} />
        </S.SettingsButton>
      )}

      {!showSpinner && !showExercises && (
        <S.TopRightStack $withSheet={showExercises}>
          <S.LikeButton onClick={() => onLike(item.id)}>
            <Icon
              name={item.isLiked ? "like" : "like-outline"}
              size={34}
              color={item.isLiked ? "#ff5f6d" : "#fff"}
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
              <Icon name="admin" size={30} color={isModerated ? "#3ec985" : "#fff"} />
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
          {tags.map((tag) => (
            <S.Badge key={tag}>{tag}</S.Badge>
          ))}
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
                pointerEvents: "none",
              }}
            >
              {contentState.loading && (
                <S.SubtitleLoading>Загружаем субтитры...</S.SubtitleLoading>
              )}
              {enSub && (
                <S.SubtitleLine style={{ fontSize: showExercises ? 18 : 20 }}>
                  {enSub}
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
        <S.ExerciseSheet $open={showExercises}>
          <S.ExerciseHandle />
          <S.ExerciseTitle>Упражнения</S.ExerciseTitle>
          {exercisesLoading && (
            <S.ExercisePlaceholder>Загружаем упражнения...</S.ExercisePlaceholder>
          )}
          {!exercisesLoading && currentExercise && (
            <S.ExerciseList>
              <S.ExerciseCard>
                <S.ExercisePrompt>{currentExercise.prompt}</S.ExercisePrompt>
                {currentExercise.direction === "en-ru" && (
                  <S.ListenButton
                    onClick={() => {
                      const ts = findWordTimestamp(
                        currentExercise.word || currentExercise.prompt,
                        wordChunks
                      );
                      if (ts === null) return;
                      const el = videoRef.current;
                      if (!el) return;
                      el.currentTime = ts;
                      el.play().catch(() => null);
                    }}
                  >
                    <Icon name="volume-on" size={18} />
                    <span>Послушать в видео</span>
                  </S.ListenButton>
                )}
                <S.ExerciseMeta>
                  <span>
                    {currentExercise.direction === "en-ru" ? "EN → RU" : "RU → EN"}
                  </span>
                  {currentExercise.translations?.length ? (
                    <span>{currentExercise.translations.join(", ")}</span>
                  ) : null}
                </S.ExerciseMeta>
                <S.ExerciseOptions>
                  {currentExercise.options.map((opt, i) => {
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
                        {opt}
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

      {showModeration && isAdmin && (
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
                  Модерация видео
                </div>
                <div style={{ fontSize: 12, color: "var(--tg-subtle)" }}>
                  ID: {item.id}
                </div>
              </div>
              <button
                onClick={() => setShowModeration(false)}
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

              <label style={{ ...labelStyle, flexDirection: "row", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={isAdult}
                  onChange={(e) => setIsAdult(e.target.checked)}
                />
                <span>18+ контент</span>
              </label>

              <label style={{ ...labelStyle, flexDirection: "row", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={isModerated}
                  onChange={(e) => setIsModerated(e.target.checked)}
                />
                <span>Видео прошло модерацию</span>
              </label>
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
                    await moderationApi.deleteVideo(item.id, auth.profile.id, auth.profile.role);
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
              <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowModeration(false)}
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
                    if (!auth.profile?.id) return;
                    try {
                      setSavingModeration(true);
                      const requests: Promise<unknown>[] = [];
                      if (cefr !== initialCefr) {
                        requests.push(
                          moderationApi.updateCefrLevel(item.id, cefr, auth.profile.id, auth.profile.role)
                        );
                      }
                      if (speech !== initialSpeech) {
                        requests.push(
                          moderationApi.updateSpeechSpeed(item.id, speech, auth.profile.id, auth.profile.role)
                        );
                      }
                      if (author !== initialAuthor) {
                        requests.push(
                          moderationApi.updateAuthor(item.id, author, auth.profile.id, auth.profile.role)
                        );
                      }
                      if (isAdult !== initialAdult) {
                        requests.push(
                          moderationApi.updateAdult(item.id, isAdult, auth.profile.id, auth.profile.role)
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
                      alert("Не удалось сохранить модерацию");
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
                <div style={{ fontSize: 18, fontWeight: 800 }}>Редактировать субтитры</div>
                <div style={{ fontSize: 12, color: "var(--tg-subtle)" }}>
                  Таймкод:{" "}
                  {localTranscription[currentChunkIndex]
                    ? `${localTranscription[currentChunkIndex].timestamp[0].toFixed(
                        2
                      )} - ${localTranscription[currentChunkIndex].timestamp[1].toFixed(2)}`
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
    </S.Card>
  );
}

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
