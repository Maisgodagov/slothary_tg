import type { TranscriptChunk } from "../../types";

export const findChunkText = (
  chunks: TranscriptChunk[] | undefined,
  currentTime: number
): string => {
  if (!chunks || chunks.length === 0) return "";

  const match = chunks.find(
    (chunk) => currentTime >= chunk.timestamp[0] && currentTime <= chunk.timestamp[1]
  );
  if (match) return match.text;

  const before = chunks
    .filter((chunk) => currentTime >= chunk.timestamp[0])
    .sort((a, b) => b.timestamp[0] - a.timestamp[0])[0];

  return before?.text ?? "";
};
