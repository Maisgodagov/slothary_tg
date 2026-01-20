import { Icon } from "../../../../shared/ui/Icon";
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
  isAdmin,
  onDetails,
}: ProgressSummaryProps) {
  if (!stats) return null;

  return (
    <ProgressSection>
      <ProgressHeader>
        <ProgressTitle>Мой прогресс</ProgressTitle>
        {isAdmin && (
          <ProgressLink type="button" onClick={onDetails}>
            Детали
          </ProgressLink>
        )}
      </ProgressHeader>
      <ProgressCard>
        {loading && <ProgressMuted>Загружаем статистику...</ProgressMuted>}
        {!loading && (
          <ProgressGrid>
            <ProgressItem>
              {/* <Icon name="exercise" size={24} color="#4da3ff" /> */}
              <ProgressValue>{stats.learningCount}</ProgressValue>
              <ProgressLabelWrapper>
                <ProgressLabel>слов</ProgressLabel>
                <ProgressLabel>ИЗУЧАЮ</ProgressLabel>
              </ProgressLabelWrapper>
            </ProgressItem>
            <ProgressDivider />
            <ProgressItem>
              {/* <Icon name="trophy" size={24} color="#2ecc71" /> */}
              <ProgressValue>{stats.knownCount}</ProgressValue>
              <ProgressLabelWrapper>
                <ProgressLabel>слов</ProgressLabel>
                <ProgressLabel>ВЫУЧЕНО</ProgressLabel>
              </ProgressLabelWrapper>
            </ProgressItem>
            <ProgressDivider />
            <ProgressItem>
              {/* <Icon name="translate" size={24} color="#8b5cf6" /> */}
              <ProgressValue>{stats.viewedCount}</ProgressValue>
              <ProgressLabelWrapper>
                <ProgressLabel>слов</ProgressLabel>
                <ProgressLabel>ПЕРЕВОДЕНО</ProgressLabel>
              </ProgressLabelWrapper>
            </ProgressItem>
          </ProgressGrid>
        )}
      </ProgressCard>
    </ProgressSection>
  );
}
