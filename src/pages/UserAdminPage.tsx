import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import {
  usersAdminApi,
  type AdminUser,
  type AdminUserActivityItem,
  type AdminUsersSummary,
} from "../features/admin/usersApi";
import { Button } from "../shared/ui/Button";
import { PageShell } from "../shared/ui/PageShell";

const PAGE_SIZE = 50;
const ACTIVITY_DAYS = 90;

export default function UserAdminPage() {
  const auth = useAppSelector(selectAuth);
  const isAdmin = auth.profile?.role === "admin";

  const [items, setItems] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<AdminUsersSummary>({
    totalUsers: 0,
    activeToday: 0,
    activeWeek: 0,
    activeMonth: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [activityByUser, setActivityByUser] = useState<
    Record<string, AdminUserActivityItem[]>
  >({});
  const [activityLoadingByUser, setActivityLoadingByUser] = useState<
    Record<string, boolean>
  >({});

  const canLoadMore = page < totalPages;
  const normalizedQuery = query.trim();

  const loadPage = async (nextPage: number, replace = false) => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const response = await usersAdminApi.getUsers(
        { page: nextPage, limit: PAGE_SIZE, search: normalizedQuery || undefined },
        auth.profile?.role ?? null
      );
      setSummary(
        response.summary ?? {
          totalUsers: response.total ?? 0,
          activeToday: 0,
          activeWeek: 0,
          activeMonth: 0,
        }
      );
      setTotalPages(response.totalPages);
      setPage(response.page);
      setItems((prev) => (replace ? response.items : [...prev, ...response.items]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async (userId: string) => {
    if (activityByUser[userId] || activityLoadingByUser[userId]) return;
    setActivityLoadingByUser((prev) => ({ ...prev, [userId]: true }));
    try {
      const response = await usersAdminApi.getUserActivity(
        userId,
        ACTIVITY_DAYS,
        auth.profile?.role ?? null
      );
      setActivityByUser((prev) => ({ ...prev, [userId]: response.items }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить активность");
    } finally {
      setActivityLoadingByUser((prev) => ({ ...prev, [userId]: false }));
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = window.setTimeout(() => {
      setExpandedUserId(null);
      loadPage(1, true);
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedQuery, isAdmin]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aTime = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
      const bTime = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [items]);

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={wrapperStyle}>
          <div style={cardStyle}>
            <div style={{ fontWeight: 700 }}>Доступ ограничен</div>
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
          <div style={{ fontWeight: 700 }}>Пользователи</div>
        </div>

        <div style={summaryGrid}>
          <SummaryCard label="Всего" value={summary?.totalUsers ?? 0} />
          <SummaryCard label="Активны сегодня" value={summary?.activeToday ?? 0} />
          <SummaryCard label="Активны 7 дней" value={summary?.activeWeek ?? 0} />
          <SummaryCard label="Активны 30 дней" value={summary?.activeMonth ?? 0} />
        </div>

        <div style={listWrapper}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по имени или email"
            style={searchInput}
          />

          {sortedItems.map((user) => {
            const expanded = expandedUserId === user.id;
            const activity = activityByUser[user.id] ?? [];
            const activityLoading = activityLoadingByUser[user.id];
            return (
              <div key={user.id} style={userCard}>
                <button
                  type="button"
                  style={userTopButton}
                  onClick={() => {
                    if (expanded) {
                      setExpandedUserId(null);
                      return;
                    }
                    setExpandedUserId(user.id);
                    loadActivity(user.id);
                  }}
                >
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
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontWeight: 700 }}>{user.fullName}</div>
                      <div style={{ color: "var(--tg-subtle)", fontSize: 13 }}>
                        {user.email}
                      </div>
                    </div>
                    <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                      {expanded ? "Скрыть" : "Подробнее"}
                    </div>
                  </div>

                  <div style={statsGrid}>
                    <StatCell label="Просмотрено видео" value={user.watchedCount} />
                    <StatCell label="Лайков" value={user.likedCount} />
                    <StatCell label="Слов в словаре" value={user.dictionaryWordsCount} />
                    <StatCell label="Упражнений" value={user.exercisesCompletedCount} />
                    <StatCell label="Слов выучено" value={user.learnedWordsCount} />
                    <StatCell label="Серия" value={user.currentStreakDays} />
                    <StatCell label="Последний визит" value={formatLastSeen(user.lastSeenAt)} />
                  </div>
                </button>

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
                          err instanceof Error ? err.message : "Не удалось обновить роль"
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

                {expanded && (
                  <div style={activityBox}>
                    <div style={{ fontWeight: 700 }}>Активность по дням (последние {ACTIVITY_DAYS})</div>
                    {activityLoading && <div style={loadingText}>Загрузка активности...</div>}
                    {!activityLoading && activity.length === 0 && (
                      <div style={emptyText}>Нет данных за выбранный период.</div>
                    )}
                    {!activityLoading && activity.length > 0 && (
                      <div style={tableWrap}>
                        <table style={tableStyle}>
                          <thead>
                            <tr>
                              <th style={thStyle}>Дата</th>
                              <th style={thStyle}>Заходил</th>
                              <th style={thStyle}>Видео</th>
                              <th style={thStyle}>Лайки</th>
                              <th style={thStyle}>Упражнения</th>
                              <th style={thStyle}>Слов добавил</th>
                              <th style={thStyle}>Фраз добавил</th>
                              <th style={thStyle}>Слов искал</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activity.map((row) => (
                              <tr key={`${user.id}-${row.date}`}>
                                <td style={tdStyle}>{formatDate(row.date)}</td>
                                <td style={tdStyle}>{row.didLogin ? "Да" : "Нет"}</td>
                                <td style={tdStyle}>{row.videosWatched}</td>
                                <td style={tdStyle}>{row.likesGiven}</td>
                                <td style={tdStyle}>{row.exercisesCompleted}</td>
                                <td style={tdStyle}>{row.wordsAdded}</td>
                                <td style={tdStyle}>{row.phrasesAdded}</td>
                                <td style={tdStyle}>{row.wordsSearched}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {error && <div style={errorText}>{error}</div>}

          {canLoadMore && !normalizedQuery && (
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={summaryCard}>
      <div style={statLabel}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 20 }}>{value}</div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={statCell}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

const getInitials = (value: string) => {
  const parts = value.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return value.slice(0, 2).toUpperCase();
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("ru-RU");
};

const formatLastSeen = (value?: string | null) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

const summaryGrid: React.CSSProperties = {
  display: "grid",
  gap: 10,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
};

const summaryCard: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
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

const userTopButton: React.CSSProperties = {
  display: "grid",
  gap: 12,
  width: "100%",
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
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

const statsGrid: React.CSSProperties = {
  display: "grid",
  gap: 8,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  textAlign: "left",
};

const statCell: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-surface)",
  padding: "8px 10px",
};

const statLabel: React.CSSProperties = {
  fontSize: 12,
  color: "var(--tg-subtle)",
};

const statValue: React.CSSProperties = {
  fontSize: 15,
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

const activityBox: React.CSSProperties = {
  display: "grid",
  gap: 8,
  borderTop: "1px solid var(--tg-border)",
  paddingTop: 10,
};

const tableWrap: React.CSSProperties = {
  overflowX: "auto",
  borderRadius: 10,
  border: "1px solid var(--tg-border)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 760,
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid var(--tg-border)",
  background: "var(--tg-surface)",
  color: "var(--tg-subtle)",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid var(--tg-border)",
};

const emptyText: React.CSSProperties = {
  color: "var(--tg-subtle)",
};

const errorText: React.CSSProperties = {
  color: "#ff6b6b",
  textAlign: "center",
};

const loadingText: React.CSSProperties = {
  color: "var(--tg-subtle)",
  textAlign: "center",
};
