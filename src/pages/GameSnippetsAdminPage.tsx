import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import { gameSnippetsApi, type GameSnippet } from "../features/game-snippets/api";
import { Icon } from "../shared/ui/Icon";
import { PageShell } from "../shared/ui/PageShell";

type FilterMode = "all" | "approved" | "pending";

const TEXT = {
  adminOnly:
    "\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u0442\u043e\u043b\u044c\u043a\u043e \u0434\u043b\u044f \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430.",
  title: "\u041c\u043e\u0434\u0435\u0440\u0430\u0446\u0438\u044f \u0441\u043d\u0438\u043f\u043f\u0435\u0442\u043e\u0432",
  all: "\u0412\u0441\u0435",
  approved: "\u041e\u0434\u043e\u0431\u0440\u0435\u043d\u044b\u0435",
  pending: "\u041d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0435",
  phrase: "\u0424\u0440\u0430\u0437\u0430",
  translation: "\u041f\u0435\u0440\u0435\u0432\u043e\u0434",
  start: "\u041d\u0430\u0447\u0430\u043b\u043e",
  end: "\u041a\u043e\u043d\u0435\u0446",
  approvedLabel: "\u041e\u0434\u043e\u0431\u0440\u0435\u043d\u043e",
  activeLabel: "\u0410\u043a\u0442\u0438\u0432\u043d\u043e",
  edit: "\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c",
  save: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c",
  cancel: "\u041e\u0442\u043c\u0435\u043d\u0430",
  remove: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c",
  empty: "\u0421\u043d\u0438\u043f\u043f\u0435\u0442\u044b \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b.",
  loading: "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c...",
};

const applyFilter = (filter: FilterMode) => {
  if (filter === "approved") return { approved: true };
  if (filter === "pending") return { approved: false };
  return undefined;
};

export default function GameSnippetsAdminPage() {
  const auth = useAppSelector(selectAuth);
  const navigate = useNavigate();
  const isAdmin = auth.profile?.role === "admin";
  const [filter, setFilter] = useState<FilterMode>("pending");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<GameSnippet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPhrase, setEditingPhrase] = useState("");
  const [editingTranslation, setEditingTranslation] = useState("");
  const [editingStart, setEditingStart] = useState("");
  const [editingEnd, setEditingEnd] = useState("");
  const [editingApproved, setEditingApproved] = useState(false);
  const [editingActive, setEditingActive] = useState(true);

  useEffect(() => {
    if (!auth.profile?.role) return;
    setLoading(true);
    gameSnippetsApi
      .list(applyFilter(filter), auth.profile.role)
      .then((result) => setItems(result.items))
      .catch(() => {
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [auth.profile?.role, filter]);

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={{ padding: 16, color: "var(--tg-subtle)" }}>
          {TEXT.adminOnly}
        </div>
      </PageShell>
    );
  }

  const beginEdit = (item: GameSnippet) => {
    setEditingId(item.id);
    setEditingPhrase(item.phrase);
    setEditingTranslation(item.translation ?? "");
    setEditingStart(item.startSeconds.toFixed(2));
    setEditingEnd(item.endSeconds.toFixed(2));
    setEditingApproved(item.isApproved);
    setEditingActive(item.isActive);
  };

  const saveEdit = (item: GameSnippet) => {
    const startSeconds = Number(editingStart);
    const endSeconds = Number(editingEnd);
    if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) return;
    if (endSeconds <= startSeconds) return;
    const phrase = editingPhrase.trim();
    if (!phrase) return;
    gameSnippetsApi
      .update(
        item.id,
        {
          phrase,
          translation: editingTranslation.trim() || null,
          startSeconds,
          endSeconds,
          isApproved: editingApproved,
          isActive: editingActive,
        },
        auth.profile?.role
      )
      .then((updated) => {
        setItems((prev) =>
          prev.map((entry) => (entry.id === updated.id ? updated : entry))
        );
        setEditingId(null);
      })
      .catch(() => null);
  };

  return (
    <PageShell>
      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={navButtonStyle}
          >
            <Icon name="back" size={18} />
          </button>
          <div style={{ fontWeight: 700 }}>{TEXT.title}</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            style={filter === "pending" ? primaryButtonStyle : ghostButtonStyle}
          >
            {TEXT.pending}
          </button>
          <button
            type="button"
            onClick={() => setFilter("approved")}
            style={filter === "approved" ? primaryButtonStyle : ghostButtonStyle}
          >
            {TEXT.approved}
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            style={filter === "all" ? primaryButtonStyle : ghostButtonStyle}
          >
            {TEXT.all}
          </button>
        </div>

        {loading && <div style={{ color: "var(--tg-subtle)" }}>{TEXT.loading}</div>}

        {!loading && items.length === 0 && (
          <div style={{ color: "var(--tg-subtle)" }}>{TEXT.empty}</div>
        )}

        {!loading && items.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((item) => (
              <div key={item.id} style={cardStyle}>
                <div style={{ display: "grid", gap: 8 }}>
                  {editingId === item.id ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      <label style={labelStyle}>
                        {TEXT.phrase}
                        <input
                          value={editingPhrase}
                          onChange={(event) =>
                            setEditingPhrase(event.target.value)
                          }
                          style={inputStyle}
                        />
                      </label>
                      <label style={labelStyle}>
                        {TEXT.translation}
                        <input
                          value={editingTranslation}
                          onChange={(event) =>
                            setEditingTranslation(event.target.value)
                          }
                          style={inputStyle}
                        />
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <label style={{ ...labelStyle, flex: 1 }}>
                          {TEXT.start}
                          <input
                            type="number"
                            step="0.1"
                            value={editingStart}
                            onChange={(event) =>
                              setEditingStart(event.target.value)
                            }
                            style={inputStyle}
                          />
                        </label>
                        <label style={{ ...labelStyle, flex: 1 }}>
                          {TEXT.end}
                          <input
                            type="number"
                            step="0.1"
                            value={editingEnd}
                            onChange={(event) =>
                              setEditingEnd(event.target.value)
                            }
                            style={inputStyle}
                          />
                        </label>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <label style={checkboxStyle}>
                          <input
                            type="checkbox"
                            checked={editingApproved}
                            onChange={(event) =>
                              setEditingApproved(event.target.checked)
                            }
                          />
                          {TEXT.approvedLabel}
                        </label>
                        <label style={checkboxStyle}>
                          <input
                            type="checkbox"
                            checked={editingActive}
                            onChange={(event) =>
                              setEditingActive(event.target.checked)
                            }
                          />
                          {TEXT.activeLabel}
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 700 }}>{item.phrase}</div>
                      {item.translation && (
                        <div style={{ color: "var(--tg-subtle)", fontSize: 13 }}>
                          {item.translation}
                        </div>
                      )}
                      <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                        {item.startSeconds.toFixed(2)}s —{" "}
                        {item.endSeconds.toFixed(2)}s
                      </div>
                      <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                        {item.videoName || `Видео #${item.contentId}`}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={badgeStyle(item.isApproved)}>
                          {item.isApproved ? TEXT.approved : TEXT.pending}
                        </span>
                        {!item.isActive && (
                          <span style={inactiveBadgeStyle}>Inactive</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {editingId === item.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => saveEdit(item)}
                        style={primaryButtonStyle}
                      >
                        {TEXT.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        style={ghostButtonStyle}
                      >
                        {TEXT.cancel}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => beginEdit(item)}
                        style={ghostButtonStyle}
                      >
                        {TEXT.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          gameSnippetsApi
                            .remove(item.id, auth.profile?.role)
                            .then(() =>
                              setItems((prev) =>
                                prev.filter((entry) => entry.id !== item.id)
                              )
                            )
                            .catch(() => null)
                        }
                        style={dangerButtonStyle}
                      >
                        {TEXT.remove}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

const navButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  height: 36,
  border: "1px solid var(--tg-border)",
  padding: "0 10px",
  background: "var(--tg-card)",
  color: "var(--tg-text)",
  cursor: "pointer",
};

const cardStyle: CSSProperties = {
  borderRadius: 16,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  padding: 14,
  display: "grid",
  gap: 12,
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-surface)",
  color: "var(--tg-text)",
  padding: "8px 10px",
  fontSize: 14,
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 12,
  color: "var(--tg-subtle)",
};

const checkboxStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  fontSize: 13,
  color: "var(--tg-text)",
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(76,196,255,0.4)",
  background: "rgba(76,196,255,0.2)",
  color: "var(--tg-text)",
  padding: "6px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const ghostButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--tg-border)",
  background: "transparent",
  color: "var(--tg-text)",
  padding: "6px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const dangerButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,107,107,0.4)",
  background: "rgba(255,107,107,0.1)",
  color: "#ff8a8a",
  padding: "6px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const badgeStyle = (approved: boolean): CSSProperties => ({
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  border: approved ? "1px solid rgba(46, 204, 113, 0.4)" : "1px solid rgba(255, 206, 86, 0.5)",
  color: approved ? "#2ecc71" : "#ffd54a",
});

const inactiveBadgeStyle: CSSProperties = {
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  border: "1px solid rgba(255, 99, 132, 0.4)",
  color: "#ff6b6b",
};
