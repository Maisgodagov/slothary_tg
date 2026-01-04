import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout, selectAuth } from "../features/auth/slice";
import { Button } from "../shared/ui/Button";
import { LoginForm } from "../features/auth/components/LoginForm";

export default function ProfilePage() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");

  const initials = useMemo(() => {
    const name = auth.profile?.fullName || auth.profile?.email || "";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [auth.profile]);

  if (!auth.profile) {
    return (
      <div
        style={{
          padding: "20px 16px",
          minHeight: "100vh",
          color: "var(--tg-text)",
          display: "grid",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← На главную
          </Button>
        </div>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Профиль</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
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
        <div style={{ fontSize: 12, color: "var(--tg-subtle)" }}>
          Если вы открыли веб-апп в Telegram, авторизация происходит автоматически.
          Здесь можно войти по логину и паролю для тестов в браузере.
        </div>
      </div>
    );
  }

  const { fullName, email, role, avatarUrl } = auth.profile;

  return (
    <div
      style={{
        padding: "20px 16px",
        minHeight: "100vh",
        color: "var(--tg-text)",
        display: "grid",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <Button variant="ghost" onClick={() => navigate("/")}>
          ← На главную
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          padding: 16,
          borderRadius: 14,
          border: "1px solid var(--tg-border)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
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
          <div style={{ color: "var(--tg-subtle)", marginTop: 2 }}>{email}</div>
          <div
            style={{
              marginTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Роль: {role}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="ghost" onClick={() => dispatch(logout())}>
          Выйти
        </Button>
      </div>
    </div>
  );
}
