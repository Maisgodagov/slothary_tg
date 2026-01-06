import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";

export default function HomePage() {
  const auth = useAppSelector(selectAuth);
  const navigate = useNavigate();

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

  const avatarUrl =
    (auth.profile as any)?.avatar ||
    (auth.profile as any)?.photoUrl ||
    (auth.profile as any)?.image ||
    (auth.profile as any)?.picture ||
    null;

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
          justifyContent: "flex-end",
          marginBottom: 12,
        }}
      >
        <button
          onClick={() => navigate("/profile")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 999,
            border: "1px solid var(--tg-border)",
            padding: "6px 10px",
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
                width: 28,
                height: 28,
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
                fontSize: 13,
                color: "#0c1021",
              }}
            >
              {initial}
            </span>
          )}
          <span style={{ fontWeight: 600 }}>{displayName}</span>
        </button>
      </div>
    </div>
  );
}
