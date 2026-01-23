import type { PublicGameSnippetGame } from '../../features/game-snippets/publicApi';

export type GameSnippet = Omit<
  PublicGameSnippetGame,
  'videoUrl' | 'videoName' | 'contentId'
> & {
  videoUrl: string;
  videoName: string;
  contentId: string;
};

export type GamePhase = 'translate' | 'missing' | 'oddword' | 'assemble';

export type AudioPhraseGameDifficulty = 1 | 2 | 3;
