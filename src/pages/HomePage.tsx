import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import { Button } from "../shared/ui/Button";

export default function HomePage() {
  const auth = useAppSelector(selectAuth);
  const navigate = useNavigate();
  const canModerate =
    auth.profile?.role === "ADMIN" || auth.profile?.role === "MODERATOR";

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        padding: "24px 16px",
        boxSizing: "border-box",
        color: "var(--tg-text)",
      }}
    >
      <h1 style={{ marginTop: 0, marginBottom: 12 }}>Главная</h1>
      <p style={{ margin: 0, color: "var(--tg-subtle)", lineHeight: 1.5 }}>
        Здесь будет витрина и контент главной страницы. Пока это заглушка.
      </p>

      {canModerate && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 12,
            border: "1px solid var(--tg-border)",
            background: "rgba(255,255,255,0.04)",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 700 }}>Админские инструменты</div>
          <div style={{ color: "var(--tg-subtle)", fontSize: 14 }}>
            Модерация предрассчитанных упражнений: промпт, варианты ответов,
            переводы и статус.
          </div>
          <div>
            <Button
              variant="primary"
              onClick={() => navigate("/admin/moderation")}
            >
              Перейти к модерации упражнений
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
