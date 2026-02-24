import styled from 'styled-components';
import {
  TrainingCard,
  TrainingHeader,
  TrainingIconButton,
  TrainingQuestion,
  TrainingTitle,
} from '../shared/trainingUi';

export const Card = TrainingCard;
export const HeaderRow = TrainingHeader;
export const HeaderTitle = TrainingTitle;

export const WordRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const WordText = TrainingQuestion;

export const Dash = styled.span`
  color: var(--tg-subtle);
  font-weight: 700;
`;

export const TranslationText = styled.span`
  font-size: clamp(22px, 6vw, 32px);
  font-weight: 700;
`;

export const PronButton = TrainingIconButton;

export const OtherWrap = styled.div`
  display: grid;
`;

export const OtherText = styled.div`
  color: var(--tg-subtle);
  font-size: 14px;
  line-height: 1.4;
`;

export const Subtle = styled.div`
  color: var(--tg-subtle);
  font-size: 14px;
`;
