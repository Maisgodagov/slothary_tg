import styled from 'styled-components';

const shimmer = `
  @keyframes dictionarySkeletonShimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
`;

export const DictionaryLayout = styled.div`
  display: grid;
  gap: 16px;
  align-content: start;
  justify-items: stretch;
  padding-top: 8px;
  padding-right: 12px;
  padding-left: 12px;
  padding-bottom: 60px;
`;

export const HelperText = styled.div`
  text-align: center;
  color: var(--tg-subtle);
  font-size: 14px;
`;

export const LoaderWrap = styled.div`
  display: grid;
  place-items: center;
`;

export const SkeletonCard = styled.div`
  border-radius: 20px;
  padding: 16px;
  background: var(--tg-card-strong);
  display: grid;
  gap: 12px;
  ${shimmer}
`;

export const SkeletonLine = styled.div<{ $w?: string; $h?: string }>`
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '14px'};
  border-radius: 10px;
  background: linear-gradient(
    90deg,
    var(--tg-card) 0%,
    var(--tg-border) 50%,
    var(--tg-card) 100%
  );
  background-size: 200% 100%;
  animation: dictionarySkeletonShimmer 1.2s linear infinite;
`;

export const SkeletonSnippetsWrap = styled.div`
  padding: 0;
  display: grid;
  gap: 6px;
`;

export const SkeletonSnippetCard = styled.div`
  width: clamp(252px, 82vw, 388px);
  height: clamp(250px, 50vh, 400px);
  margin: 0 auto;
  border-radius: 25px;
  background: linear-gradient(
    90deg,
    var(--tg-card) 0%,
    var(--tg-border) 50%,
    var(--tg-card) 100%
  );
  background-size: 200% 100%;
  animation: dictionarySkeletonShimmer 1.2s linear infinite;
  border: 1px solid var(--tg-border);
  overflow: hidden;
`;

export const SkeletonSnippetCounter = styled.div`
  width: 72px;
  height: 16px;
  margin: 2px auto 0;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--tg-card) 0%,
    var(--tg-border) 50%,
    var(--tg-card) 100%
  );
  background-size: 200% 100%;
  animation: dictionarySkeletonShimmer 1.2s linear infinite;
`;

export const SectionTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: var(--tg-text);
  padding-left: 4px;
`;

export const DictionarySection = styled.div`
  display: grid;
  gap: 12px;
`;

export const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  padding-left: 4px;
`;

export const FilterButton = styled.button<{ $active?: boolean }>`
  border: 1px solid var(--tg-border);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'var(--tg-card)' : 'var(--tg-card-strong)')};
  color: ${({ $active }) => ($active ? 'var(--tg-text)' : 'var(--tg-subtle)')};
`;

export const UserList = styled.div`
  display: grid;
  gap: 12px;
`;

export const DictionaryListSkeleton = styled.div`
  display: grid;
  gap: 10px;
`;

export const DictionaryListSkeletonItem = styled.div`
  border-radius: 18px;
  padding: 14px 14px 12px;
  background: var(--tg-card-strong);
  display: grid;
  gap: 10px;
`;

export const EmptyText = styled.div`
  color: var(--tg-subtle);
  font-size: 13px;
  padding-left: 4px;
`;

export const UserEntryWrapper = styled.div`
  position: relative;
`;

export const DeleteEntryButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--tg-subtle);
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 2;
`;

export const Clickable = styled.div`
  cursor: pointer;
`;

export const InlineCenter = styled.div`
  display: grid;
  place-items: center;
`;

export const ErrorText = styled.div`
  color: var(--tg-danger);
  font-size: 13px;
`;

export const SubtleText = styled.div`
  color: var(--tg-subtle);
  font-size: 13px;
`;
