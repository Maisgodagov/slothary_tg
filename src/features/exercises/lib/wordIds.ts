const normalizeForm = (raw: string): string | null => {
  const lower = raw
    .trim()
    .toLowerCase()
    .replace(/[`’]/g, "'");
  const cleaned = lower.replace(/[^a-z'\-]/g, '');
  if (cleaned.length < 2 || cleaned.length > 25) return null;
  return cleaned;
};

const splitWords = (text: string): string[] =>
  text
    .split(/[^A-Za-z'\-]+/g)
    .filter(Boolean);

let formsMap: Record<string, number> | null = null;

const loadFormsMap = async (): Promise<Record<string, number>> => {
  if (formsMap) return formsMap;
  const base = import.meta.env.BASE_URL || '/';
  const res = await fetch(`${base}forms_index.json`);
  if (!res.ok) throw new Error('Не удалось загрузить индекс словаря');
  formsMap = (await res.json()) as Record<string, number>;
  return formsMap!;
};

type SubtitleChunk = { text: string };

export const wordIdsFromSubtitles = async (
  subtitles: (string | SubtitleChunk)[],
  options?: { limit?: number },
): Promise<number[]> => {
  if (!subtitles.length) return [];
  const map = await loadFormsMap();
  const forms: string[] = [];

  for (const item of subtitles) {
    const text = typeof item === 'string' ? item : item.text;
    if (!text) continue;
    forms.push(...splitWords(text));
  }

  const normalized = Array.from(
    new Set(forms.map((f) => normalizeForm(f)).filter((v): v is string => Boolean(v))),
  );
  const ids: number[] = [];
  const limit = options?.limit ?? 200;

  for (const form of normalized) {
    const id = map[form];
    if (typeof id === 'number' && Number.isFinite(id) && id > 0) {
      ids.push(id);
      if (ids.length >= limit) break;
    }
  }
  return Array.from(new Set(ids));
};
