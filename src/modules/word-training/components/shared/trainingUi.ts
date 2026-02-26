import styled, { css } from 'styled-components';

export const trainingCardSurface = css`
  display: grid;
  gap: 12px;
  border-radius: 22px;
`;

export const TrainingCard = styled.div`
  ${trainingCardSurface};
`;

export const TrainingHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

export const TrainingTitle = styled.strong`
  font-size: 17px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--tg-text);
`;

export const TrainingQuestion = styled.div`
  font-size: clamp(28px, 7vw, 40px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
`;

export const TrainingIconButton = styled.button<{ $enabled?: boolean }>`
  width: 42px;
  height: 42px;
  border-radius: 16px;
  border: 3px solid var(--tg-button-neutral-border);
  background: var(--tg-button-neutral-bg);
  color: var(--tg-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $enabled = true }) => ($enabled ? 1 : 0.45)};
  flex-shrink: 0;
  box-shadow:
    0 4px 0 var(--tg-button-neutral-shadow),
    0 8px 14px var(--tg-shadow-strong);
  transform: translateY(0);
  transition: transform 120ms ease, box-shadow 140ms ease, opacity 140ms ease;
  &:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow:
      0 2px 0 var(--tg-button-neutral-shadow),
      0 4px 8px var(--tg-shadow-soft);
  }
`;

const answerBorderColor = ($correct?: boolean, $wrong?: boolean, $selected?: boolean) => {
  if ($correct) return 'var(--tg-button-positive-border)';
  if ($wrong) return 'var(--tg-button-negative-border)';
  if ($selected) return 'var(--tg-button-primary-border)';
  return 'var(--tg-border)';
};

const answerBackgroundColor = ($correct?: boolean, $wrong?: boolean, $selected?: boolean) => {
  if ($correct) return 'var(--tg-button-positive-bg)';
  if ($wrong) return 'var(--tg-button-negative-bg)';
  if ($selected) return 'var(--tg-button-primary-bg)';
  return 'var(--tg-button-neutral-bg)';
};

const answerShadowColor = ($correct?: boolean, $wrong?: boolean, $selected?: boolean) => {
  if ($correct) return 'var(--tg-button-positive-shadow)';
  if ($wrong) return 'var(--tg-button-negative-shadow)';
  if ($selected) return 'var(--tg-button-primary-shadow)';
  return 'var(--tg-button-neutral-shadow)';
};

const answerTextColor = ($correct?: boolean, $wrong?: boolean, $selected?: boolean) => {
  if ($correct || $wrong || $selected) return 'var(--tg-text-on-accent)';
  return 'var(--tg-text)';
};

type AnswerStateProps = { $correct?: boolean; $wrong?: boolean; $selected?: boolean };

export const TrainingAnswerButton = styled.button<AnswerStateProps>`
  min-height: 50px;
  border-radius: 16px;
  padding: 10px 12px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
  border-style: solid;
  border-width: 3px;
  border-color: ${({ $correct, $wrong, $selected }) =>
    answerBorderColor($correct, $wrong, $selected)};
  background: ${({ $correct, $wrong, $selected }) =>
    answerBackgroundColor($correct, $wrong, $selected)};
  color: ${({ $correct, $wrong, $selected }) => answerTextColor($correct, $wrong, $selected)};
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease, transform 120ms ease;
  box-shadow:
    0 4px 0 ${({ $correct, $wrong, $selected }) =>
      answerShadowColor($correct, $wrong, $selected)},
    0 8px 14px var(--tg-shadow-strong);
  cursor: pointer;
  transform: translateY(0);
  &:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow:
      0 2px 0 ${({ $correct, $wrong, $selected }) =>
        answerShadowColor($correct, $wrong, $selected)},
      0 4px 8px var(--tg-shadow-soft);
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

export const TrainingTokenButton = styled.button<AnswerStateProps>`
  min-height: 50px;
  border-radius: 16px;
  padding: 10px 12px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
  border-style: solid;
  border-width: 3px;
  border-color: ${({ $correct, $wrong, $selected }) =>
    answerBorderColor($correct, $wrong, $selected)};
  background: ${({ $correct, $wrong, $selected }) =>
    answerBackgroundColor($correct, $wrong, $selected)};
  color: ${({ $correct, $wrong, $selected }) => answerTextColor($correct, $wrong, $selected)};
  box-shadow:
    0 4px 0 ${({ $correct, $wrong, $selected }) =>
      answerShadowColor($correct, $wrong, $selected)},
    0 8px 14px var(--tg-shadow-strong);
  transform: translateY(0);
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease, transform 120ms ease;
  &:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow:
      0 2px 0 ${({ $correct, $wrong, $selected }) =>
        answerShadowColor($correct, $wrong, $selected)},
      0 4px 8px var(--tg-shadow-soft);
  }
  &:disabled {
    opacity: 0.6;
  }
`;

export const TrainingSlot = styled.span<{ $correct?: boolean; $wrong?: boolean; $filled?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 82px;
  min-height: 44px;
  border-radius: 16px;
  border: ${({ $correct, $wrong }) =>
    $correct
      ? '3px solid var(--tg-button-positive-border)'
      : $wrong
      ? '3px solid var(--tg-button-negative-border)'
      : '3px dashed var(--tg-border)'};
  margin: 0 4px;
  vertical-align: middle;
  color: ${({ $filled }) => ($filled ? 'var(--tg-text)' : 'var(--tg-subtle)')};
  font-size: 20px;
  font-weight: 700;
  padding: 4px 12px;
  background: ${({ $correct, $wrong }) => answerBackgroundColor($correct, $wrong)};
`;

