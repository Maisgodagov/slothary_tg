import styled from 'styled-components';

export const Card = styled.div`
  width: 100%;
  max-width: 560px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  display: grid;
  gap: 12px;
`;

export const ProfileRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

export const Avatar = styled.div<{ $isAdmin: boolean }>`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #2ea3ff55, #6dd3ff33);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #0c1021;
  font-size: 20px;
  border: ${({ $isAdmin }) => ($isAdmin ? '2px solid #f2c45a' : 'none')};
`;

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const Name = styled.div`
  font-size: 20px;
  font-weight: 700;
`;

export const Badge = styled.div`
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--tg-border);
  background: var(--tg-surface);
  color: var(--tg-text);
  font-size: 12px;
  font-weight: 700;
`;

export const BadgeSubtle = styled.span`
  color: var(--tg-subtle);
  font-weight: 600;
`;

export const Actions = styled.div`
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`;

export const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  color: var(--tg-text);
  display: grid;
  place-items: center;
  cursor: pointer;
`;
