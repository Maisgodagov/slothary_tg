import type { ProgressSummaryProps } from "./types";
import {
  ProgressCard,
  ProgressDivider,
  ProgressGrid,
  ProgressHeader,
  ProgressItem,
  ProgressLabel,
  ProgressLabelWrapper,
  ProgressLink,
  ProgressMuted,
  ProgressSection,
  ProgressTitle,
  ProgressValue,
} from "./styles";

export function ProgressSummary({
  stats,
  loading,
  onDetails,
}: ProgressSummaryProps) {
  if (!stats) return null;

  return (
    <ProgressSection>
      <ProgressHeader>
        <ProgressTitle>Мой прогресс</ProgressTitle>
        <ProgressLink type="button" onClick={onDetails}>
          Детали
        </ProgressLink>
      </ProgressHeader>
      <ProgressCard type="button" onClick={onDetails}>
        {loading && <ProgressMuted>Загружаем статистику...</ProgressMuted>}
        {!loading && (
          <ProgressGrid>
            <ProgressItem>
              <ProgressValue>{stats.learningCount}</ProgressValue>
              <ProgressLabelWrapper>
                <ProgressLabel>Слов</ProgressLabel>
                <ProgressLabel>изучаю</ProgressLabel>
              </ProgressLabelWrapper>
            </ProgressItem>
            <ProgressDivider />
            <ProgressItem>
              <ProgressValue>{stats.knownCount}</ProgressValue>
              <ProgressLabelWrapper>
                <ProgressLabel>Слов</ProgressLabel>
                <ProgressLabel>выучено</ProgressLabel>
              </ProgressLabelWrapper>
            </ProgressItem>
            <ProgressDivider />
            <ProgressItem>
              <ProgressValue>{stats.viewedCount}</ProgressValue>
              <ProgressLabelWrapper>
                <ProgressLabel>Слов</ProgressLabel>
                <ProgressLabel>переведено</ProgressLabel>
              </ProgressLabelWrapper>
            </ProgressItem>
          </ProgressGrid>
        )}
      </ProgressCard>
    </ProgressSection>
  );
}

export default ProgressSummary;
