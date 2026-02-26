import { Button } from '../../../../shared/ui/Button';
import MasteryGrid from '../MasteryGrid';
import type { TrainingHomeProps } from './types';
import {
  HomeLayout,
  CurrentBlockCounter,
  CurrentBlockTitle,
  CurrentBlockTitleRow,
  CurrentBlockWrap,
  LearnButtonLabel,
  LearnButtonSub,
  LevelRingInner,
  LevelRingOuter,
  MasteryArea,
  ProgressCard,
  ProgressFill,
  ProgressTopRow,
  ProgressTrack,
} from '../../container/WordTraining/styles';

export function TrainingHome({
  overview,
  currentDisplayLevel,
  levelRingPercent,
  submitting,
  masteryLoading,
  suggestedWordsCount,
  masteryMap,
  actionTitle,
  actionSubtitle,
  onStartOrResume,
  focusLevel,
  focusBlock,
}: TrainingHomeProps) {
  const buttonTitle = actionTitle ?? 'Учить слова';
  const buttonSubtitle = actionSubtitle ?? `+ ${suggestedWordsCount} новых слов`;

  return (
    <HomeLayout>
      <ProgressCard>
        <ProgressTopRow>
          <CurrentBlockWrap>
            <CurrentBlockTitleRow>
              <CurrentBlockTitle>{(overview.currentBlockTitle || 'Текущий блок').trim()}</CurrentBlockTitle>
              <CurrentBlockCounter>
                {overview.currentBlockProgress
                  ? `${overview.currentBlockProgress.knownWords}/${overview.currentBlockProgress.totalWords}`
                  : ''}
              </CurrentBlockCounter>
            </CurrentBlockTitleRow>
            <ProgressTrack>
              <ProgressFill
                $width={Math.max(0, Math.min(100, Number(overview.currentBlockProgress?.percent ?? 0)))}
              />
            </ProgressTrack>
          </CurrentBlockWrap>
          <LevelRingOuter title={`Уровень ${currentDisplayLevel}: ${levelRingPercent}%`}>
            <LevelRingInner>{currentDisplayLevel}</LevelRingInner>
          </LevelRingOuter>
        </ProgressTopRow>
        <Button
          onClick={onStartOrResume}
          disabled={submitting || masteryLoading}
          style={{
            minHeight: 52,
            fontSize: 20,
            fontWeight: 700,
            borderRadius: 24,
            borderStyle: 'solid',
            borderWidth: '3px',
            borderColor: 'var(--tg-button-primary-border)',
            boxShadow: '0 4px 0 var(--tg-button-primary-shadow), 0 8px 14px var(--tg-shadow-strong)',
            marginTop: 4,
            background: 'var(--tg-button-primary-bg)',
            backgroundImage: 'none',
            color: 'var(--tg-button-primary-text)',
          }}
        >
          <LearnButtonLabel>
            <span>{buttonTitle}</span>
            <LearnButtonSub>{buttonSubtitle}</LearnButtonSub>
          </LearnButtonLabel>
        </Button>
      </ProgressCard>

      <MasteryArea>
        <MasteryGrid
          masteryMap={masteryMap}
          fillHeight
          autoScrollToFocus
          focusLevel={focusLevel}
          focusBlock={focusBlock}
        />
      </MasteryArea>
    </HomeLayout>
  );
}

export default TrainingHome;


