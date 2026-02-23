import { useEffect, useMemo, useRef } from 'react';

import type { WordTrainingMasteryMap } from '../../api/types';
import type { MasteryGridProps } from './types';
import {
  Cell,
  CellsGrid,
  GridCard,
  LevelHeaderCounter,
  LevelHeaderRow,
  LevelHeaderTitle,
  LevelWrap,
  SectionTitle,
  SectionWrap,
} from './styles';

const CEFR_LEVELS: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'> = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const MASTERY_BG = {
  known: '#2ac46f',
  learning: '#f2c94c',
  new: 'rgba(255,255,255,0.16)',
} as const;

const normalizeSectionTitleKey = (title: string) =>
  String(title ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .trim()
    .toLowerCase();

const getCefrBlockOrder = (block: string | null | undefined, level: string) => {
  if (!block) return Number.MAX_SAFE_INTEGER;
  const match = String(block).toUpperCase().match(new RegExp(`^${level.toUpperCase()}_(\\d+)$`));
  if (!match) return Number.MAX_SAFE_INTEGER;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
};

const groupByLevel = (items: WordTrainingMasteryMap['items']) => {
  const grouped: Record<string, typeof items> = {};
  for (const level of CEFR_LEVELS) grouped[level] = [];
  for (const item of items) {
    const level = (item.cefrLevel ?? '').toUpperCase();
    if (!grouped[level]) grouped[level] = [];
    grouped[level].push(item);
  }
  return grouped;
};

export function MasteryGrid({
  masteryMap,
  animated = false,
  fillHeight = false,
  animatedFilledCellIds = {},
  focusLevel = null,
  focusBlock = null,
  autoScrollToFocus = false,
}: MasteryGridProps) {
  if (!masteryMap) return null;

  const grouped = groupByLevel(masteryMap.items);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const levelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusedKeyRef = useRef<string | null>(null);

  const normalizedFocusLevel = useMemo(
    () => String(focusLevel ?? '').trim().toUpperCase(),
    [focusLevel],
  );
  const normalizedFocusBlock = useMemo(
    () => String(focusBlock ?? '').trim().toUpperCase(),
    [focusBlock],
  );

  useEffect(() => {
    if (!autoScrollToFocus) return;
    const container = gridRef.current;
    if (!container) return;

    const focusKey = normalizedFocusBlock || normalizedFocusLevel;
    if (!focusKey || focusedKeyRef.current === focusKey) return;

    const target =
      (normalizedFocusBlock && sectionRefs.current[normalizedFocusBlock]) ||
      (normalizedFocusLevel && levelRefs.current[normalizedFocusLevel]) ||
      null;
    if (!target) return;

    focusedKeyRef.current = focusKey;
    requestAnimationFrame(() => {
      const top = Math.max(0, target.offsetTop - 10);
      container.scrollTo({ top, behavior: 'smooth' });
    });
  }, [autoScrollToFocus, normalizedFocusBlock, normalizedFocusLevel, masteryMap]);

  return (
    <GridCard $fillHeight={fillHeight} ref={gridRef}>
      {CEFR_LEVELS.map((level) => {
        const levelItems = grouped[level] ?? [];
        const levelStats = masteryMap.byLevel[level];
        if (!levelItems.length || !levelStats) return null;

        const sectionsMap = new Map<
          string,
          { title: string; order: number; items: typeof levelItems; sectionBlockKey: string }
        >();
        for (const item of levelItems) {
          const sectionKey = item.cefrBlock || `${level}_1`;
          const title = masteryMap.blockTitles?.[sectionKey] ?? sectionKey;
          const normalizedTitleKey = normalizeSectionTitleKey(title);
          const order = getCefrBlockOrder(sectionKey, level);
          if (!sectionsMap.has(normalizedTitleKey)) {
            sectionsMap.set(normalizedTitleKey, {
              title: title.trim(),
              order,
              items: [],
              sectionBlockKey: String(sectionKey).toUpperCase(),
            });
          }
          const section = sectionsMap.get(normalizedTitleKey)!;
          section.order = Math.min(section.order, order);
          if (order < getCefrBlockOrder(section.sectionBlockKey, level)) {
            section.sectionBlockKey = String(sectionKey).toUpperCase();
          }
          section.items.push(item);
        }

        const sections = Array.from(sectionsMap.values()).sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
        });

        return (
          <LevelWrap
            key={level}
            ref={(node) => {
              levelRefs.current[level] = node;
            }}
          >
            <LevelHeaderRow>
              <LevelHeaderTitle>Уровень {level}</LevelHeaderTitle>
              <LevelHeaderCounter>
                {levelStats.known}/{levelStats.total}
              </LevelHeaderCounter>
            </LevelHeaderRow>

            {sections.map((section, sectionIndex) => (
              <SectionWrap
                key={`${level}-${section.title}`}
                $isFirst={sectionIndex === 0}
                ref={(node) => {
                  sectionRefs.current[section.sectionBlockKey] = node;
                }}
              >
                <SectionTitle>{section.title}</SectionTitle>
                <CellsGrid>
                  {section.items.map((item) => {
                    const filledAnimated = animated && Boolean(animatedFilledCellIds[item.id]);
                    const bg = filledAnimated ? MASTERY_BG.known : MASTERY_BG[item.mastery];
                    return <Cell key={item.id} title={`${item.word} (${item.cefrLevel})`} $bg={bg} />;
                  })}
                </CellsGrid>
              </SectionWrap>
            ))}
          </LevelWrap>
        );
      })}
    </GridCard>
  );
}

export default MasteryGrid;
