export type SnippetPlayable = {
  videoUrl?: string | null;
  startSeconds: number;
  endSeconds: number;
};

export type SnippetPlayerProps = {
  snippet: SnippetPlayable;
};
