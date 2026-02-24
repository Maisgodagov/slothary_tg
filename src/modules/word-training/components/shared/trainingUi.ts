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
  border: 3px solid var(--tg-border);
  background: #20273a;
  color: var(--tg-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $enabled = true }) => ($enabled ? 1 : 0.45)};
  flex-shrink: 0;
  box-shadow:
    0 4px 0 #151b2a,
    0 8px 14px rgba(0, 0, 0, 0.22);
  transform: translateY(0);
  transition: transform 120ms ease, box-shadow 140ms ease, opacity 140ms ease;
  &:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow:
      0 2px 0 #151b2a,
      0 4px 8px rgba(0, 0, 0, 0.18);
  }
`;

const answerBorderColor = ($correct?: boolean, $wrong?: boolean, $selected?: boolean) => {
  if ($correct) return '#4dcf75';
  if ($wrong) return '#ff6b76';
  if ($selected) return '#2ea3ff';
  return 'var(--tg-border)';
};

const answerBackgroundColor = ($correct?: boolean, $wrong?: boolean, $selected?: boolean) => {
  if ($correct) return '#4dcf75';
  if ($wrong) return '#ff6b76';
  if ($selected) return '#2ea3ff';
  return 'rgba(255,255,255,0.03)';
};

const answerShadowColor = ($correct?: boolean, $wrong?: boolean, $selected?: boolean) => {
  if ($correct) return '#2e9d52';
  if ($wrong) return '#d94a57';
  if ($selected) return '#1a79c7';
  return '#1a1f2f';
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
  color: var(--tg-text);
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease, transform 120ms ease;
  box-shadow:
    0 4px 0 ${({ $correct, $wrong, $selected }) =>
      answerShadowColor($correct, $wrong, $selected)},
    0 8px 14px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  transform: translateY(0);
  &:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow:
      0 2px 0 ${({ $correct, $wrong, $selected }) =>
        answerShadowColor($correct, $wrong, $selected)},
      0 4px 8px rgba(0, 0, 0, 0.18);
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
  color: var(--tg-text);
  box-shadow:
    0 4px 0 ${({ $correct, $wrong, $selected }) =>
      answerShadowColor($correct, $wrong, $selected)},
    0 8px 14px rgba(0, 0, 0, 0.22);
  transform: translateY(0);
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease, transform 120ms ease;
  &:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow:
      0 2px 0 ${({ $correct, $wrong, $selected }) =>
        answerShadowColor($correct, $wrong, $selected)},
      0 4px 8px rgba(0, 0, 0, 0.18);
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
      ? '3px solid rgba(67, 201, 127, 0.98)'
      : $wrong
      ? '3px solid rgba(255, 95, 109, 0.98)'
      : '3px dashed var(--tg-border)'};
  margin: 0 4px;
  vertical-align: middle;
  color: ${({ $filled }) => ($filled ? 'var(--tg-text)' : 'var(--tg-subtle)')};
  font-size: 20px;
  font-weight: 700;
  padding: 4px 12px;
  background: ${({ $correct, $wrong }) => answerBackgroundColor($correct, $wrong)};
`;
