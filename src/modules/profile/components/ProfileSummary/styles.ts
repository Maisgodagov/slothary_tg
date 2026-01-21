import styled from "styled-components";

export const Card = styled.section`
  width: 100%;
  display: grid;
  gap: 18px;
`;

export const TopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
`;

export const CenterBlock = styled.div`
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 6px;
`;

export const AvatarRing = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin-top: 30px;
  padding: 4px;
  background: #3c4267;
  display: grid;
  place-items: center;
`;

export const Avatar = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #2ea3ff55, #6dd3ff33);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #0c1021;
  font-size: 24px;
`;

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const LevelPill = styled.div`
  margin-top: -26px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #1f2a3c;
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  [data-theme="light"] & {
    background: #0f172a;
  }
`;

export const Name = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: var(--tg-text);
`;

export const Subline = styled.div`
  color: var(--tg-subtle);
  font-size: 12px;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
`;

export const StatCard = styled.button<{ $clickable?: boolean }>`
  border-radius: 16px;
  padding: 14px;
  background: var(--tg-card);
  display: grid;
  gap: 8px;
  min-height: 92px;
  justify-items: center;
  text-align: center;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  border: 1px solid var(--tg-border);
  color: var(--tg-text);
  outline: none;
`;

export const StatIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);

  [data-theme="light"] & {
    background: rgba(15, 23, 42, 0.06);
  }
`;

export const StatValue = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: var(--tg-text);
`;

export const StatLabel = styled.div`
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tg-subtle);
`;

export const SettingsSection = styled.div`
  display: grid;
  gap: 10px;
`;

export const SettingsTitle = styled.div`
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--tg-subtle);
`;

export const SettingsList = styled.div`
  display: grid;
  gap: 10px;
`;

export const SettingsItem = styled.button`
  border-radius: 16px;
  border: 1px solid var(--tg-border);
  background: var(--tg-card);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--tg-text);
  cursor: pointer;
`;

export const SettingsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const SettingsIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);

  [data-theme="light"] & {
    background: rgba(15, 23, 42, 0.06);
  }
`;

export const SettingsText = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

export const SettingsRight = styled.div`
  color: var(--tg-subtle);
  font-size: 18px;
`;

export const Actions = styled.div<{
  $align?: "start" | "center";
  $justify?: "start" | "end";
}>`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: ${({ $justify }) =>
    $justify === "start" ? "flex-start" : "flex-end"};
  align-self: ${({ $align }) => ($align === "start" ? "flex-start" : "center")};
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
