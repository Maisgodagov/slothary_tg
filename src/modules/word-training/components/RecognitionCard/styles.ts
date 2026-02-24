import styled from 'styled-components';
import {
  TrainingAnswerButton,
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
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
`;

export const WordText = TrainingQuestion;
export const PronButton = TrainingIconButton;

export const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 8px;
`;

export const OptionButton = TrainingAnswerButton;
