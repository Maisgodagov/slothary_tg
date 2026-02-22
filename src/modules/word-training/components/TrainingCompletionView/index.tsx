import { Button } from '../../../../shared/ui/Button';
import MasteryGrid from '../MasteryGrid';
import {
  PraiseCard,
  PraiseIcon,
  PraiseMeta,
  PraiseText,
  PraiseTitle,
  PraiseTitleRow,
} from './styles';
import type { TrainingCompletionViewProps } from './types';

export function TrainingCompletionView({
  stage,
  wordsCompleted,
  xpEarned,
  totalWordsToday,
  totalXpToday,
  masteryMap,
  animatedFilledCellIds,
  submitting,
  onRestart,
}: TrainingCompletionViewProps) {
  if (stage === 'praise') {
    return (
      <PraiseCard className="section">
        <PraiseTitleRow>
          <PraiseIcon>🔥</PraiseIcon>
          <PraiseTitle>Отличная тренировка!</PraiseTitle>
        </PraiseTitleRow>
        <PraiseText>Ты закрыл {wordsCompleted} слов и получил +{xpEarned} XP.</PraiseText>
        <PraiseMeta>
          За сегодня: {totalWordsToday} слов · {totalXpToday} XP
        </PraiseMeta>
      </PraiseCard>
    );
  }

  return (
    <>
      <MasteryGrid masteryMap={masteryMap} animated animatedFilledCellIds={animatedFilledCellIds} />
      <Button
        onClick={onRestart}
        disabled={submitting}
        style={{
          minHeight: 52,
          fontSize: 20,
          fontWeight: 800,
          boxShadow: 'none',
          background: 'var(--tg-accent-strong)',
          backgroundImage: 'none',
          color: '#0b0b0b',
        }}
      >
        Учить слова
      </Button>
    </>
  );
}

export default TrainingCompletionView;
