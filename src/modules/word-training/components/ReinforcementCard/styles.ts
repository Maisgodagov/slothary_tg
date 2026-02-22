import styled from 'styled-components';

export const Card = styled.div`
  display: grid;
  gap: 12px;
  border-radius: 22px;
`;

export const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
`;

export const Title = styled.strong<{ $isMatchPairs: boolean; $isMissing: boolean }>`
  font-size: ${({ $isMatchPairs, $isMissing }) => ($isMatchPairs || $isMissing ? '25px' : 'inherit')};
  line-height: ${({ $isMatchPairs, $isMissing }) => ($isMatchPairs || $isMissing ? '1.15' : 'inherit')};
  font-weight: ${({ $isMatchPairs, $isMissing }) => ($isMatchPairs || $isMissing ? 600 : 'inherit')};
  margin-bottom: ${({ $isMatchPairs, $isMissing }) => ($isMatchPairs ? '24px' : $isMissing ? '20px' : '0')};
  display: inline-block;
`;

export const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 16px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  color: var(--tg-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const AudioTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
`;

export const TranslationText = styled.div`
  font-size: clamp(30px, 7vw, 38px);
  font-weight: 800;
  line-height: 1.14;
  letter-spacing: -0.02em;
  margin: 4px 0 10px;
`;

export const SlotsWrap = styled.div`
  min-height: 52px;
  padding: 2px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

export const BankWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

