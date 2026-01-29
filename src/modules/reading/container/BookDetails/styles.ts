import styled from "styled-components";

export const DetailWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 12px 20px;
  background: linear-gradient(180deg, #0e1422 0%, #0b111c 100%);
`;

export const Header = styled.div`
  display: grid;
  grid-template-columns: 32px 1fr 32px;
  align-items: center;
  gap: 8px;
`;

export const BackButton = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--tg-text);
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

export const IconButton = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--tg-text);
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  justify-self: end;
`;

export const HeaderTitle = styled.div`
  text-align: center;
  font-size: 16px;
  font-weight: 800;
  color: var(--tg-text);
`;

export const Hero = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 0 6px;
`;

export const HeroCover = styled.div<{ $url?: string | null }>`
  width: 180px;
  height: 240px;
  border-radius: 18px;
  background: ${({ $url }) =>
    $url
      ? `linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,0,0,0.55)), url(${$url})`
      : "linear-gradient(135deg, #1a1f2b, #2c364d)"};
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
`;

export const InfoCard = styled.div`
  background: #141b2f;
  border-radius: 20px;
  padding: 16px;
  display: grid;
  gap: 8px;
`;

export const LevelTag = styled.div`
  background: rgba(109, 211, 255, 0.14);
  color: var(--tg-accent);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  width: fit-content;
`;

export const Title = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: var(--tg-text);
`;

export const Subtitle = styled.div`
  font-size: 13px;
  color: var(--tg-text-secondary);
`;

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 6px;
`;

export const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 10px 8px;
  text-align: center;
`;

export const StatValue = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: var(--tg-text);
`;

export const StatLabel = styled.div`
  font-size: 11px;
  color: var(--tg-text-secondary);
`;

export const Progress = styled.div`
  font-size: 12px;
  color: var(--tg-text-secondary);
`;

export const AboutCard = styled.div`
  background: #141b2f;
  border-radius: 20px;
  padding: 16px;
  display: grid;
  gap: 12px;
`;

export const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: var(--tg-text);
`;

export const Description = styled.div`
  font-size: 13px;
  line-height: 1.5;
  color: var(--tg-text-secondary);
`;

export const ReaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const ReaderAvatars = styled.div`
  display: flex;
  align-items: center;
`;

export const Avatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffb86c, #ff6b81);
  border: 2px solid #141b2f;
  margin-left: -6px;

  &:first-child {
    margin-left: 0;
  }
`;

export const ReaderMeta = styled.div`
  font-size: 12px;
  color: var(--tg-text-secondary);
`;

export const Rating = styled.div`
  margin-left: auto;
  font-size: 12px;
  color: #ffd166;
  font-weight: 800;
`;

export const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

export const Button = styled.button<{ $primary?: boolean }>`
  border-radius: 12px;
  border: 1px solid var(--tg-border);
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
  background: ${({ $primary }) =>
    $primary ? "linear-gradient(135deg, #2ea3ff, #6dd3ff)" : "transparent"};
  color: ${({ $primary }) => ($primary ? "#0c1021" : "var(--tg-text)")};
`;

export const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 14px;
  color: var(--tg-text-secondary);
`;

