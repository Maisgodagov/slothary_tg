import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import { usersAdminApi, type AdminUser } from "../features/admin/usersApi";
import { Button } from "../shared/ui/Button";
import { PageShell } from "../shared/ui/PageShell";

const PAGE_SIZE = 50;

export default function UserAdminPage() {
  const auth = useAppSelector(selectAuth);
  const isAdmin = auth.profile?.role === "admin";

  const [items, setItems] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const canLoadMore = page < totalPages;

  const loadPage = async (nextPage: number, replace = false) => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const response = await usersAdminApi.getUsers(
        { page: nextPage, limit: PAGE_SIZE },
        auth.profile?.role ?? null
      );
      setTotalPages(response.totalPages);
      setPage(response.page);
      setItems((prev) =>
        replace ? response.items : [...prev, ...response.items]
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить пользователей"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const base = normalized
      ? items.filter((user) => {
          const name = (user.fullName || user.email || "").toLowerCase();
          return name.includes(normalized);
        })
      : items;
    return [...base].sort((a, b) => {
      const aTime = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
      const bTime = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [items, query]);

  const title = useMemo(() => {
    if (!isAdmin) return "Доступ ограничен";
    return "Пользователи";
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={wrapperStyle}>
        <div className="page-header" style={headerRow}>
        </div>
        <div style={cardStyle}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div style={{ color: "var(--tg-subtle)" }}>
            Только администратор может просматривать список пользователей.
          </div>
        </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={wrapperStyle}>
      <div className="page-header" style={headerRow}>
        <div style={{ fontWeight: 700 }}>{title}</div>
      </div>

      <div style={listWrapper}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по имени"
          style={searchInput}
        />
        {filteredItems.map((user) => (
          <div key={user.id} style={userCard}>
            <div style={userHeader}>
              <div style={avatarStyle}>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  getInitials(user.fullName || user.email)
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{user.fullName}</div>
                <div style={{ color: "var(--tg-subtle)", fontSize: 13 }}>
                  {user.email}
                </div>
              </div>
            </div>

            <div style={statsRow}>
              <div>
                <div style={statLabel}>Просмотрено</div>
                <div style={statValue}>{user.watchedCount}</div>
              </div>
              <div>
                <div style={statLabel}>Лайков</div>
                <div style={statValue}>{user.likedCount}</div>
              </div>
              <div>
                <div style={statLabel}>Заходил</div>
                <div style={statValue}>{formatLastSeen(user.lastSeenAt)}</div>
              </div>
            </div>

            <div style={roleRow}>
              <span style={{ color: "var(--tg-subtle)" }}>Роль</span>
              <select
                value={user.role}
                disabled={saving[user.id]}
                onChange={async (event) => {
                  const nextRole = event.target.value as AdminUser["role"];
                  if (nextRole === user.role) return;
                  setSaving((prev) => ({ ...prev, [user.id]: true }));
                  try {
                    await usersAdminApi.updateUserRole(
                      user.id,
                      nextRole,
                      auth.profile?.role ?? null
                    );
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === user.id ? { ...item, role: nextRole } : item
                      )
                    );
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Не удалось обновить роль"
                    );
                  } finally {
                    setSaving((prev) => ({ ...prev, [user.id]: false }));
                  }
                }}
                style={roleSelect}
              >
                <option value="student">student</option>
                <option value="teacher">teacher</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>
        ))}

        {error && <div style={errorText}>{error}</div>}

        {canLoadMore && (
          <Button
            variant="ghost"
            onClick={() => loadPage(page + 1)}
            disabled={loading}
            style={{ justifySelf: "center" }}
          >
            Показать еще
          </Button>
        )}

        {loading && <div style={loadingText}>Загрузка...</div>}
      </div>
      </div>
    </PageShell>
  );
}

const getInitials = (value: string) => {
  const parts = value.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return value.slice(0, 2).toUpperCase();
};

const formatLastSeen = (value?: string | null) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 180) {
    if (diffMinutes < 1) return "Только что";
    if (diffMinutes < 60) return `${diffMinutes} минут назад`;
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} часов назад`;
  }

  const pad2 = (num: number) => String(num).padStart(2, "0");
  const time = `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thatDay = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );
  const dayDiff = Math.round((today.getTime() - thatDay.getTime()) / 86400000);

  if (dayDiff === 0) {
    return `Сегодня в ${time}`;
  }
  if (dayDiff === 1) {
    return `Вчера в ${time}`;
  }

  const months = [
    "Января",
    "Февраля",
    "Марта",
    "Апреля",
    "Мая",
    "Июня",
    "Июля",
    "Августа",
    "Сентября",
    "Октября",
    "Ноября",
    "Декабря",
  ];

  const day = parsed.getDate();
  const month = months[parsed.getMonth()] || "";
  const year = parsed.getFullYear();

  if (year === now.getFullYear()) {
    return `${day} ${month} в ${time}`;
  }

  return `${day} ${month} ${year} в ${time}`;
};

const wrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  paddingBottom: "70px",
  paddingLeft: 12,
  paddingRight: 12,
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const listWrapper: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const searchInput: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  color: "var(--tg-text)",
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
};

const cardStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
};

const userCard: React.CSSProperties = {
  ...cardStyle,
  display: "grid",
  gap: 12,
};

const userHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const avatarStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  overflow: "hidden",
  background: "linear-gradient(135deg, #2ea3ff55, #6dd3ff33)",
  display: "grid",
  placeItems: "center",
  fontWeight: 700,
  color: "#0c1021",
};

const statsRow: React.CSSProperties = {
  display: "flex",
  gap: 16,
};

const statLabel: React.CSSProperties = {
  fontSize: 12,
  color: "var(--tg-subtle)",
};

const statValue: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
};

const roleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const roleSelect: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-surface)",
  color: "var(--tg-text)",
  fontWeight: 600,
};

const errorText: React.CSSProperties = {
  color: "#ff6b6b",
  textAlign: "center",
};

const loadingText: React.CSSProperties = {
  color: "var(--tg-subtle)",
  textAlign: "center",
};
