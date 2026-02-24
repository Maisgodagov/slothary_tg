import styled from 'styled-components';
import {
  TrainingAnswerButton,
  TrainingCard,
  TrainingQuestion,
  TrainingSlot,
  TrainingTokenButton,
  TrainingHeader,
  TrainingTitle,
} from '../shared/trainingUi';

export const Card = TrainingCard;
export const HeaderRow = TrainingHeader;
export const Title = TrainingTitle;

export const TranslationText = styled(TrainingQuestion)`
  font-size: clamp(34px, 8vw, 44px);
`;

export const AssembleLine = styled.div`
  min-height: 52px;
  padding: 2px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

export const AssembleWordChip = styled(TrainingTokenButton)`
  min-height: 42px;
  border-radius: 18px;
  padding: 4px 12px;
`;

export const SlotChip = styled(TrainingSlot)`
  min-height: 42px;
  border-radius: 18px;
  margin: 0 4px;
`;

export const BankWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const OptionButton = styled(TrainingAnswerButton)`
  border-radius: 18px;
  font-size: 22px;
`;

export const TokenButton = styled(TrainingTokenButton)`
  border-radius: 18px;
  font-size: 22px;
`;

export const PairsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 8px;
`;

export const PairsColumn = styled.div`
  display: grid;
  gap: 12px;
`;

export const MissingOptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
`;

export const MissingSentence = styled.div`
  min-height: 56px;
  padding: 4px;
  font-size: 23px;
  font-weight: 700;
  line-height: 1.28;
`;
