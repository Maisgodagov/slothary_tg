import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout, selectAuth } from "../features/auth/slice";
import { Button } from "../shared/ui/Button";
import { LoginForm } from "../features/auth/components/LoginForm";
import { useTelegram } from "../app/providers/TelegramProvider";

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
      <div style={wrapperStyle}>
        <div style={headerRow}>
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← На главную
          </Button>
          <h2 style={{ margin: 0 }}>Профиль</h2>
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant={mode === "login" ? "primary" : "ghost"}
              onClick={() => setMode("login")}
            >
              Войти
            </Button>
            <Button
              variant={mode === "register" ? "primary" : "ghost"}
              onClick={() => setMode("register")}
            >
              Регистрация
            </Button>
          </div>
          <LoginForm mode={mode} />
          <ThemeSelector themeMode={themeMode} setThemeMode={setThemeMode} />
          <div style={hintText}>
            Если вы открыли веб-апп в Telegram, авторизация происходит
            автоматически. Здесь можно войти по логину и паролю для тестов в
            браузере.
          </div>
        </div>
      </div>
    );
  }

  const { fullName, email, role, avatarUrl } = auth.profile;

  return (
    <div style={wrapperStyle}>
      <div style={headerRow}>
        <Button variant="ghost" onClick={() => navigate("/")}>
          ← На главную
        </Button>
      </div>

      <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12 }}>
        <div style={{ ...cardStyle, display: "flex", gap: 16, alignItems: "center" }}>
          <div style={avatarStyle}>
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
            <div style={{ color: "var(--tg-subtle)", marginTop: 2 }}>{email}</div>
            <div style={roleBadge}>Роль: {role}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" onClick={() => dispatch(logout())}>
            Выйти
          </Button>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 700 }}>Тема приложения</div>
          <ThemeSelector themeMode={themeMode} setThemeMode={setThemeMode} />
          <div style={hintText}>
            Сейчас: {themeMode === "system" ? `как в системе (${theme})` : themeMode}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeSelector({
  themeMode,
  setThemeMode,
}: {
  themeMode: "light" | "dark" | "system";
  setThemeMode: (m: "light" | "dark" | "system") => void;
}) {
  const options: { label: string; value: "light" | "dark" | "system" }[] = [
    { label: "Как в системе", value: "system" },
    { label: "Светлая", value: "light" },
    { label: "Тёмная", value: "dark" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setThemeMode(opt.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border:
              themeMode === opt.value
                ? "1px solid var(--tg-accent-strong)"
                : "1px solid var(--tg-border)",
            background:
              themeMode === opt.value
                ? "rgba(109, 211, 255, 0.15)"
                : "var(--tg-surface)",
            color: "var(--tg-text)",
            cursor: "pointer",
            fontWeight: 700,
            minWidth: 120,
            textAlign: "center",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  padding: "20px 16px 32px",
  minHeight: "100vh",
  color: "var(--tg-text)",
  background: "var(--tg-bg)",
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

const roleBadge: React.CSSProperties = {
  marginTop: 8,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.06)",
  fontSize: 13,
  fontWeight: 600,
};

const hintText: React.CSSProperties = {
  fontSize: 12,
  color: "var(--tg-subtle)",
};
