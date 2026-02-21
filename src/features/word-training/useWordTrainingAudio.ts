import { useCallback, useEffect, useRef } from 'react';

export function useWordTrainingAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const feedbackAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return;
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } catch {
      // ignore
    }
    audioRef.current = null;
  }, []);

  const stopFeedbackAudio = useCallback(() => {
    if (!feedbackAudioRef.current) return;
    try {
      feedbackAudioRef.current.pause();
      feedbackAudioRef.current.currentTime = 0;
    } catch {
      // ignore
    }
    feedbackAudioRef.current = null;
  }, []);

  const playAudioUrl = useCallback(
    async (audioUrl?: string | null) => {
      const trimmed = audioUrl?.trim();
      if (!trimmed) return;

      stopAudio();

      const audio = new Audio(trimmed);
      audio.preload = 'auto';
      audioRef.current = audio;

      try {
        await audio.play();
      } catch {
        // autoplay can be blocked
      }
    },
    [stopAudio],
  );

  const playFeedbackSound = useCallback(
    async (isCorrect: boolean) => {
      const baseUrl = import.meta.env.BASE_URL ?? '/';
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const soundUrl = `${normalizedBase}sounds/${isCorrect ? 'right.wav' : 'wrong.wav'}`;
      stopFeedbackAudio();

      const sound = new Audio(soundUrl);
      sound.preload = 'auto';
      feedbackAudioRef.current = sound;
      try {
        await sound.play();
      } catch {
        // ignore
      }
    },
    [stopFeedbackAudio],
  );

  useEffect(
    () => () => {
      stopAudio();
      stopFeedbackAudio();
    },
    [stopAudio, stopFeedbackAudio],
  );

  return {
    playAudioUrl,
    playFeedbackSound,
    stopAudio,
  };
}

