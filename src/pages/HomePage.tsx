import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { Icon } from "../shared/ui/Icon";
import { selectAuth } from "../features/auth/slice";

export default function HomePage() {
  const auth = useAppSelector(selectAuth);
  const navigate = useNavigate();
  const [showStreakModal, setShowStreakModal] = useState(false);

  const initial = (
    auth.profile?.fullName?.[0] ??
    auth.profile?.email?.[0] ??
    "U"
  ).toUpperCase();

  const displayName =
    auth.profile?.fullName ||
    auth.profile?.email ||
    (auth.profile as any)?.username ||
    "Профиль";

  const streakDays = auth.profile?.streakDays ?? 0;

  const avatarUrl =
    auth.profile?.avatarUrl ||
    (auth.profile as any)?.avatar ||
    (auth.profile as any)?.photoUrl ||
    (auth.profile as any)?.image ||
    (auth.profile as any)?.picture ||
    null;

  const getStreakMessage = (days: number) => {
    if (days <= 0) {
      return "Похоже, это ваш первый день. Отличный старт!";
    }
    if (days === 1) {
      return "Вы заходили в приложение 1 день подряд. Так держать!";
    }
    if (days <= 3) {
      return `Вы заходили в приложение ${days} дня подряд. Хороший темп, продолжайте!`;
    }
    if (days <= 6) {
      return `Уже ${days} дней подряд! Отличная дисциплина — не сбавляйте обороты.`;
    }
    if (days <= 13) {
      return `Круто! ${days} дней подряд — это стабильность и прогресс.`;
    }
    if (days <= 29) {
      return `Вау! ${days} дней подряд. Очень сильная серия, продолжайте в том же духе.`;
    }
    return `Невероятно! ${days} дней подряд. Вы мощно прокачали привычку.`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        padding: "24px 16px",
        boxSizing: "border-box",
        color: "var(--tg-text)",
        background: "var(--tg-bg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <button
          onClick={() => setShowStreakModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 10px",
            borderRadius: 999,
            border: "1px solid var(--tg-border)",
            background: "var(--tg-card)",
            color: "var(--tg-text)",
            height: 40,
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Icon name="flame" size={24} color="#ff9f45" />
          <span>{streakDays} дн.</span>
        </button>
        <button
          onClick={() => navigate("/profile")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 999,
            height: 40,
            border: "1px solid var(--tg-border)",
            padding: "0 10px",
            background: "var(--tg-card)",
            color: "var(--tg-text)",
            cursor: "pointer",
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid var(--tg-border)",
              }}
            />
          ) : (
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2ea3ff55, #6dd3ff44)",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 14,
                color: "#0c1021",
              }}
            >
              {initial}
            </span>
          )}
          <span style={{ fontWeight: 600 }}>{displayName}</span>
        </button>
      </div>

      {showStreakModal && (
        <div
          onClick={() => setShowStreakModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(360px, 92vw)",
              background: "var(--tg-card)",
              border: "1px solid var(--tg-border)",
              borderRadius: 16,
              padding: 16,
              color: "var(--tg-text)",
              display: "grid",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 700 }}>Серия дней</div>
              <button
                onClick={() => setShowStreakModal(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--tg-text)",
                  cursor: "pointer",
                }}
                aria-label="Закрыть"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div style={{ color: "var(--tg-subtle)", fontSize: 14 }}>
              {getStreakMessage(streakDays)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
