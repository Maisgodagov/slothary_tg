import styled from "styled-components";

export const PageWrap = styled.div`
  display: grid;
  gap: 18px;
  padding: 12px 16px 80px;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const HeaderTitle = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: var(--tg-text);
`;

export const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: var(--tg-card-strong);
  color: var(--tg-text);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
`;

export const StreakCard = styled.div`
  background: var(--tg-card-strong);
  border-radius: 20px;
  padding: 18px;
  display: grid;
  gap: 10px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
`;

export const StreakRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const StreakValue = styled.div`
  font-size: 44px;
  font-weight: 800;
  color: var(--tg-text);
`;

export const StreakLabel = styled.div`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--tg-subtle);
`;

export const CalendarCard = styled.div`
  background: var(--tg-card-strong);
  border-radius: 20px;
  padding: 16px;
  display: grid;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
`;

export const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const MonthLabel = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--tg-text);
  text-transform: capitalize;
`;

export const Weekdays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  font-size: 12px;
  color: var(--tg-subtle);
  text-align: center;
`;

export const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
`;

export const DayCell = styled.div<{
  $active?: boolean;
  $today?: boolean;
  $disabled?: boolean;
}>`
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 600;
  background: ${({ $active }) => ($active ? "var(--tg-accent)" : "transparent")};
  color: ${({ $active, $disabled }) => {
    if ($active) return "#fff";
    if ($disabled) return "var(--tg-border)";
    return "var(--tg-text)";
  }};
  border: ${({ $today }) => ($today ? "1px solid var(--tg-accent)" : "1px solid transparent")};
`;

export const Hint = styled.div`
  font-size: 12px;
  color: var(--tg-subtle);
  text-align: center;
`;
