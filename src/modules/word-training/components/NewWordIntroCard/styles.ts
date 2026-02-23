import styled from 'styled-components';
import { Button } from '../../../../shared/ui/Button';

export const Card = styled.div`
  display: grid;
  gap: 10px;
  border-radius: 22px;
  margin-top: -8px;
`;

export const HeaderRow = styled.div`
  display: none;
`;

export const HeaderTitle = styled.strong`
  font-size: 20px;
  line-height: 1.15;
  font-weight: 600;
`;

export const WordRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 0;
`;

export const WordText = styled.div`
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
`;

export const Dash = styled.span`
  color: var(--tg-subtle);
  font-weight: 700;
`;

export const TranslationText = styled.span`
  font-size: 24px;
`;

export const PronButton = styled.button<{ $enabled: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: 16px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  color: var(--tg-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $enabled }) => ($enabled ? 1 : 0.45)};
  flex-shrink: 0;
`;

export const OtherWrap = styled.div`
  display: grid;
  gap: 0;
`;

export const OtherText = styled.div`
  color: var(--tg-subtle);
  font-size: 13px;
  line-height: 1.4;
`;

export const HintText = styled.div`
  color: var(--tg-subtle);
  font-size: 11px;
  line-height: 1.4;
`;

export const Subtle = styled.div`
  color: var(--tg-subtle);
  font-size: 14px;
`;

export const KnowButton = styled(Button).attrs({ variant: 'ghost' })`
  min-height: 40px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  background: transparent !important;
  background-image: none !important;
  border: 1px solid var(--tg-border);
  color: var(--tg-subtle);
  width: 100%;
  box-shadow: none !important;
  filter: none !important;
`;

export const KnowRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

export const InfoWrap = styled.div`
  position: relative;
`;

export const InfoButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  color: var(--tg-subtle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const InfoPopover = styled.div`
  position: absolute;
  right: 0;
  top: 40px;
  width: 220px;
  z-index: 20;
  border-radius: 12px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  color: var(--tg-subtle);
  font-size: 12px;
  line-height: 1.35;
  padding: 8px 10px;
`;
