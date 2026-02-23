import { X } from 'lucide-react';
import type { TrainingSessionHeaderProps } from './types';
import {
  CloseButton,
  ProgressFill,
  ProgressRow,
  ProgressTrack,
  Wrap,
} from './styles';

export function TrainingSessionHeader({
  submitting,
  lessonProgressPercent,
  onFinishEarly,
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
    </Wrap>
  );
}

export default TrainingSessionHeader;
