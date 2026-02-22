export type NewWordIntro = {
  wordKey: string;
  word: string;
  translation: string;
  pronunciationAudioUrl?: string | null;
  cefrLevel?: string | null;
  otherTranslations?: string[];
};

export type NewWordIntroCardProps = {
  introWord: NewWordIntro;
  onPlayAudio: (url: string | null) => void;
};
