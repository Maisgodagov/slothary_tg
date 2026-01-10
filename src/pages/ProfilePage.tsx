import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout, selectAuth } from "../features/auth/slice";
import { Button } from "../shared/ui/Button";
import { LoginForm } from "../features/auth/components/LoginForm";
import { useTelegram } from "../app/providers/TelegramProvider";
import { Icon } from "../shared/ui/Icon";

export default function ProfilePage() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const { themeMode, setThemeMode, theme } = useTelegram();

  const initials = useMemo(() => {
    const name = auth.profile?.fullName || auth.profile?.email || "";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [auth.profile]);

  if (!auth.profile) {
    return (
      <div className="page page--content" style={wrapperStyle}>
        <div className="page-header" style={headerRow}>
          <h2 style={{ margin: 0 }}>Профиль</h2>
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant={mode === "login" ? "primary" : "ghost"}
              onClick={() => setMode("login")}
            >
              Вход
            </Button>
            <Button
              variant={mode === "register" ? "primary" : "ghost"}
              onClick={() => setMode("register")}
            >
              Регистрация
            </Button>
          </div>
          <LoginForm mode={mode} />
          <div style={hintText}>
            Если вы открыли приложение вне Telegram, используйте вход по логину
            и паролю. В Telegram авторизация происходит автоматически.
          </div>
        </div>
      </div>
    );
  }

  const { fullName, email, role, avatarUrl } = auth.profile;
  const isTelegramUser = email?.endsWith("@telegram.local");

  return (
    <div className="page page--content" style={wrapperStyle}>
      {/* <div className="page-header" style={headerRow} /> */}

      <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12 }}>
        <div
          style={{
            ...cardStyle,
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              ...avatarStyle,
              border: role === "admin" ? "2px solid #f2c45a" : "none",
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials || "U"
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{fullName}</div>
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            {!isTelegramUser && (
              <button
                type="button"
                onClick={() => dispatch(logout())}
                style={iconButtonStyle}
                aria-label="Выйти"
                title="Выйти"
              >
                <Icon name="logout" size={18} />
              </button>
            )}

            <ThemeToggle
              themeMode={themeMode}
              systemTheme={theme}
              setThemeMode={setThemeMode}
            />
          </div>
        </div>

        {role === "admin" && (
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="primary"
              onClick={() => navigate("/admin/moderation")}
            >
              Модерация упражнений
            </Button>
            <Button variant="ghost" onClick={() => navigate("/admin/users")}>
              Администрирование пользователей
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ThemeToggle({
  themeMode,
  systemTheme,
  setThemeMode,
}: {
  themeMode: "light" | "dark" | "system";
  systemTheme: "light" | "dark";
  setThemeMode: (m: "light" | "dark") => void;
}) {
  const isDark =
    themeMode === "dark" || (themeMode === "system" && systemTheme === "dark");
  const activeColor = isDark ? "#3a4db7" : "#f19a0e";

  return (
    <button
      type="button"
      onClick={() => setThemeMode(isDark ? "light" : "dark")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: 4,
        borderRadius: 999,
        border: "1px solid var(--tg-border)",
        background: "var(--tg-surface)",
        color: "var(--tg-text)",
        cursor: "pointer",
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}
      aria-label="Переключить тему"
      title="Переключить тему"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          width: 80,
          height: 40,
          borderRadius: 999,
          background: "var(--tg-card)",
          padding: 4,
          gap: 4,
          transition: "background 0.25s ease",
        }}
      >
        <div
          style={{
            borderRadius: 999,
            background: isDark ? "transparent" : activeColor,
            display: "grid",
            placeItems: "center",
            transition: "background 0.3s ease",
          }}
        >
          <Icon
            name="sun"
            size={18}
            color={isDark ? "var(--tg-subtle)" : "#fff"}
          />
        </div>
        <div
          style={{
            borderRadius: 999,
            background: isDark ? activeColor : "transparent",
            display: "grid",
            placeItems: "center",
            transition: "background 0.3s ease",
          }}
        >
          <Icon
            name="moon"
            size={18}
            color={isDark ? "#fff" : "var(--tg-subtle)"}
          />
        </div>
      </div>
    </button>
  );
}

const wrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
};

const headerRow: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  minHeight: 40,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  padding: 16,
  borderRadius: 14,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  display: "grid",
  gap: 12,
};

const avatarStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  overflow: "hidden",
  background: "linear-gradient(135deg, #2ea3ff55, #6dd3ff33)",
  display: "grid",
  placeItems: "center",
  fontWeight: 700,
  color: "#0c1021",
  fontSize: 20,
};

const hintText: React.CSSProperties = {
  fontSize: 12,
  color: "var(--tg-subtle)",
};

const iconButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  color: "var(--tg-text)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};
