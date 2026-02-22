import { X } from 'lucide-react';
import { TrainingStageStepper } from '../../../../features/word-training/components/TrainingStageStepper';
import type { TrainingSessionHeaderProps } from './types';
import {
  CloseButton,
  DebugButton,
  MetaLine,
  ProgressFill,
  ProgressRow,
  ProgressTrack,
  RetryPhaseCard,
  Wrap,
} from './styles';

export function TrainingSessionHeader({
  submitting,
  lessonProgressPercent,
  lessonProgressLabel,
  currentStageLabel,
  stageProgress,
  isAdmin,
  retryPhaseTitle,
  showRetryPhase,
  onFinishEarly,
  onSkipDebug,
}: TrainingSessionHeaderProps) {
  return (
    <Wrap>
      <ProgressRow>
        <CloseButton type="button" onClick={onFinishEarly} disabled={submitting} aria-label="Завершить урок">
          <X size={24} />
        </CloseButton>
        <ProgressTrack>
          <ProgressFill $percent={lessonProgressPercent} />
        </ProgressTrack>
      </ProgressRow>

      <MetaLine>{lessonProgressLabel}</MetaLine>
      {currentStageLabel ? <MetaLine $weight={600}>Этап: {currentStageLabel}</MetaLine> : null}

      <TrainingStageStepper stages={stageProgress} />

      {isAdmin ? (
        <DebugButton type="button" onClick={onSkipDebug} disabled={submitting}>
          Скип к финалу (debug)
        </DebugButton>
      ) : null}

      {showRetryPhase ? <RetryPhaseCard>{retryPhaseTitle ?? 'Закрепляем ошибки'}</RetryPhaseCard> : null}
    </Wrap>
  );
}

export default TrainingSessionHeader;

