import type { PhraseSnippet } from '../../../../features/video-dictionary/api';

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
  snippets: PhraseSnippet[];
  snippetsLoading: boolean;
  onPlayAudio: (url: string | null) => void;
};
