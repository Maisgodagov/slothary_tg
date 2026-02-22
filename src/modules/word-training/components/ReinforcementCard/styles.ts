import styled from 'styled-components';
import { Button } from '../../../../shared/ui/Button';

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

export const SlotChip = styled.span<{ $correct?: boolean; $wrong?: boolean; $filled?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 82px;
  min-height: 40px;
  border-radius: 18px;
  border: ${({ $correct, $wrong }) =>
    $correct
      ? '3px solid rgba(67, 201, 127, 0.85)'
      : $wrong
      ? '3px solid rgba(255, 95, 109, 0.9)'
      : '3px dashed var(--tg-border)'};
  margin: 0 6px;
  vertical-align: middle;
  color: ${({ $filled }) => ($filled ? 'var(--tg-text)' : 'var(--tg-subtle)')};
  font-size: 22px;
  font-weight: 700;
  padding: 4px 12px;
  background: ${({ $correct, $wrong }) =>
    $correct
      ? 'rgba(67, 201, 127, 0.12)'
      : $wrong
      ? 'rgba(255, 95, 109, 0.12)'
      : 'rgba(255,255,255,0.03)'};
`;

export const BankWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const OptionButton = styled(Button)<{ $correct?: boolean; $wrong?: boolean; $selected?: boolean }>`
  min-height: 48px;
  border-radius: 18px;
  padding: 10px 12px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  border-style: solid;
  border-width: 3px;
  border-color: ${({ $correct, $wrong, $selected }) =>
    $correct
      ? 'rgba(67, 201, 127, 0.7)'
      : $wrong
      ? 'rgba(255, 95, 109, 0.8)'
      : $selected
      ? 'rgba(46, 163, 255, 0.75)'
      : 'var(--tg-border)'};
`;

export const TokenButton = styled.button`
  min-height: 48px;
  border-radius: 18px;
  padding: 10px 12px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  border-style: solid;
  border-width: 3px;
  border-color: var(--tg-border);
  background: var(--tg-card);
  color: var(--tg-text);
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
