import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../app/hooks";
import { useTelegram } from "../app/providers/TelegramProvider";
import { selectAuth } from "../features/auth/slice";
import { usersApi } from "../features/users/api";
import { Icon } from "../shared/ui/Icon";
import { PageShell } from "../shared/ui/PageShell";
import {
  CalendarCard,
  CalendarHeader,
  DayCell,
  DaysGrid,
  HeaderRow,
  HeaderTitle,
  IconButton,
  MonthLabel,
  PageWrap,
  StreakCard,
  StreakLabel,
  StreakRow,
  StreakValue,
  Weekdays,
} from "./StreakPage.styles";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const buildMonthGrid = (month: Date) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const cells: Array<Date | null> = [];

  for (let i = 0; i < totalCells; i += 1) {
    const dayNumber = i - startOffset + 1;
    if (dayNumber < 1 || dayNumber > lastDay.getDate()) {
      cells.push(null);
    } else {
      cells.push(new Date(year, monthIndex, dayNumber));
    }
  }

  return cells;
};

const formatDaysLabel = (value: number) => {
  const lastTwo = value % 100;
  const last = value % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "дней подряд";
  if (last === 1) return "день подряд";
  if (last >= 2 && last <= 4) return "дня подряд";
  return "дней подряд";
};

export default function StreakPage() {
  const auth = useAppSelector(selectAuth);
  const navigate = useNavigate();
  const { themeMode, theme } = useTelegram();
  const isLightTheme =
    themeMode === "light" || (themeMode === "system" && theme === "light");
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [month, setMonth] = useState(() => new Date());

  useEffect(() => {
    if (!auth.profile?.id) return;
    usersApi
      .getStreakHistory(auth.profile.id)
      .then((data) => {
        if (data?.dates?.length) {
          setActiveDates(new Set(data.dates));
          return;
        }
        const today = new Date();
        const fallback = new Set<string>();
        const total = auth.profile?.streakDays ?? 0;
        for (let i = 0; i < total; i += 1) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          fallback.add(toDateKey(date));
        }
        setActiveDates(fallback);
      })
      .catch(() => {
        const today = new Date();
        const fallback = new Set<string>();
        const total = auth.profile?.streakDays ?? 0;
        for (let i = 0; i < total; i += 1) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          fallback.add(toDateKey(date));
        }
        setActiveDates(fallback);
      });
  }, [auth.profile?.id, auth.profile?.streakDays]);

  const monthLabel = useMemo(() => {
    return month.toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  const cells = useMemo(() => buildMonthGrid(month), [month]);
  const todayKey = toDateKey(new Date());

  return (
    <PageShell>
      <PageWrap>
        <HeaderRow>
          <IconButton
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Назад"
          >
            <Icon name="back" size={18} />
          </IconButton>
          <HeaderTitle>Моя активность</HeaderTitle>
          <div style={{ width: 36 }} />
        </HeaderRow>

        <StreakCard>
          <StreakRow>
            <div>
              <StreakValue>{auth.profile?.streakDays ?? 0}</StreakValue>
              <StreakLabel>{formatDaysLabel(auth.profile?.streakDays ?? 0)}</StreakLabel>
            </div>
            <Icon
              name="flame-filled"
              size={56}
              color="#F97316"
              fillColor={isLightTheme ? "#FDE68A" : "#442D22"}
            />
          </StreakRow>
        </StreakCard>

        <CalendarCard>
          <CalendarHeader>
            <IconButton
              type="button"
              onClick={() =>
                setMonth(
                  (prev) =>
                    new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
              aria-label="Предыдущий месяц"
            >
              <Icon name="back" size={18} />
            </IconButton>
            <MonthLabel>{monthLabel}</MonthLabel>
            <IconButton
              type="button"
              onClick={() =>
                setMonth(
                  (prev) =>
                    new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
              aria-label="Следующий месяц"
            >
              <Icon
                name="back"
                size={18}
                style={{ transform: "rotate(180deg)" }}
              />
            </IconButton>
          </CalendarHeader>

          <Weekdays>
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </Weekdays>

          <DaysGrid>
            {cells.map((date, index) => {
              if (!date) {
                return <DayCell key={`empty-${index}`} $disabled />;
              }
              const key = toDateKey(date);
              return (
                <DayCell
                  key={key}
                  $active={activeDates.has(key)}
                  $today={key === todayKey}
                >
                  {date.getDate()}
                </DayCell>
              );
            })}
          </DaysGrid>
        </CalendarCard>
      </PageWrap>
    </PageShell>
  );
}
