import styled from 'styled-components';

export const DictionaryLayout = styled.div`
  display: grid;
  gap: 16px;
  align-content: start;
  justify-items: stretch;
  padding-top: 8px;
  padding-right: 12px;
  padding-left: 12px;
  padding-bottom: 60px;
`;

export const HelperText = styled.div`
  text-align: center;
  color: var(--tg-subtle);
  font-size: 14px;
`;

export const LoaderWrap = styled.div`
  display: grid;
  place-items: center;
`;

export const SectionTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: var(--tg-text);
  padding-left: 4px;
`;

export const DictionarySection = styled.div`
  display: grid;
  gap: 12px;
`;

export const UserList = styled.div`
  display: grid;
  gap: 12px;
`;

export const EmptyText = styled.div`
  color: var(--tg-subtle);
  font-size: 13px;
  padding-left: 4px;
`;

export const UserEntryWrapper = styled.div`
  position: relative;
`;

export const DeleteEntryButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--tg-subtle);
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 2;
`;

export const Clickable = styled.div`
  cursor: pointer;
`;

export const InlineCenter = styled.div`
  display: grid;
  place-items: center;
`;

export const ErrorText = styled.div`
  color: var(--tg-danger);
  font-size: 13px;
`;

export const SubtleText = styled.div`
  color: var(--tg-subtle);
  font-size: 13px;
`;
