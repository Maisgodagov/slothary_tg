import styled from "styled-components";

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 8px 0 6px;
  gap: 12px;
`;

export const HeaderCard = styled.button`
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 12px;
  color: var(--tg-text);
  padding: 12px 14px;
  cursor: pointer;
  text-align: left;
  background: none;
  border: none;
`;

export const AvatarWrap = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 2px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const AvatarInitial = styled.span`
  font-weight: 700;
  font-size: 16px;
  color: #0c1021;
`;

export const HeaderText = styled.div`
  min-width: 0;
  display: grid;
  gap: 4px;
`;

export const Greeting = styled.div`
  font-weight: 700;
  font-size: 20px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Subline = styled.div`
  color: var(--tg-subtle);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const StreakButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 99px;
  border: none;
  background: rgba(255, 255, 255, 0.04);
  color: var(--tg-text);
  font-weight: 700;
  cursor: pointer;
  min-width: 88px;
  justify-content: center;

  [data-theme="light"] & {
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.08);
  }
`;

export const StreakCount = styled.span`
  font-size: 16px;
`;
