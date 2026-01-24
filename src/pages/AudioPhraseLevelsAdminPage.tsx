import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import { audioPhraseLevelsAdminApi, type AudioPhraseLevelAdminListItem, type AudioPhraseSnippetAdminItem } from "../features/audio-phrase-levels/adminApi";
import { PageShell } from "../shared/ui/PageShell";

const TEXT = {
  adminOnly: "Доступно только для администратора.",
  title: "Модерация уровней аудиофраз",
  create: "Создать уровень",
  save: "Сохранить",
  cancel: "Отмена",
  remove: "Удалить",
  levelOrder: "Номер уровня",
  xpReward: "Награда XP",
  isActive: "Активен",
  snippets: "Сниппеты",
  empty: "Уровни не найдены.",
  loading: "Загружаем...",
};

export default function AudioPhraseLevelsAdminPage() {
  const auth = useAppSelector(selectAuth);
  const isAdmin = auth.profile?.role === "admin";
  const [levels, setLevels] = useState<AudioPhraseLevelAdminListItem[]>([]);
  const [snippets, setSnippets] = useState<AudioPhraseSnippetAdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [order, setOrder] = useState(1);
  const [xpReward, setXpReward] = useState(25);
  const [isActive, setIsActive] = useState(true);
  const [selectedSnippets, setSelectedSnippets] = useState<string[]>([]);

  useEffect(() => {
    if (!auth.profile?.role) return;
    setLoading(true);
    Promise.all([
      audioPhraseLevelsAdminApi.list(auth.profile.role),
      audioPhraseLevelsAdminApi.listSnippets(auth.profile.role),
    ])
      .then(([levelsResponse, snippetsResponse]) => {
        setLevels(levelsResponse.items);
        setSnippets(snippetsResponse.items);
      })
      .catch(() => {
        setLevels([]);
        setSnippets([]);
      })
      .finally(() => setLoading(false));
  }, [auth.profile?.role]);

  const beginCreate = () => {
    setEditingId("new");
    setOrder(levels.length + 1);
    setXpReward(25);
    setIsActive(true);
    setSelectedSnippets([]);
  };

  const beginEdit = (level: AudioPhraseLevelAdminListItem) => {
    setEditingId(level.id);
    setOrder(level.order);
    setXpReward(level.xpReward);
    setIsActive(level.isActive);
    audioPhraseLevelsAdminApi
      .getById(level.id, auth.profile?.role)
      .then((detail) => {
        setSelectedSnippets(detail.levelSnippets.map((entry) => entry.snippet.id));
      })
      .catch(() => setSelectedSnippets([]));
  };

  const toggleSnippet = (id: string) => {
    setSelectedSnippets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const saveLevel = () => {
    const role = auth.profile?.role;
    if (!role) return;
    if (selectedSnippets.length === 0) return;
    const payload = {
      order,
      xpReward,
      isActive,
      snippetIds: selectedSnippets,
    };
    const request =
      editingId === "new"
        ? audioPhraseLevelsAdminApi.create(payload, role)
        : audioPhraseLevelsAdminApi.update(editingId as string, payload, role);
    request
      .then(() => audioPhraseLevelsAdminApi.list(role))
      .then((result) => {
        setLevels(result.items);
        setEditingId(null);
      })
      .catch(() => null);
  };

  const removeLevel = (id: string) => {
    if (!auth.profile?.role) return;
    audioPhraseLevelsAdminApi
      .remove(id, auth.profile.role)
      .then(() => setLevels((prev) => prev.filter((item) => item.id !== id)))
      .catch(() => null);
  };

  const sortedSnippets = useMemo(
    () => snippets.sort((a, b) => a.phrase.localeCompare(b.phrase)),
    [snippets]
  );

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={{ padding: 16, color: "var(--tg-subtle)" }}>{TEXT.adminOnly}</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={{ padding: 16, display: "grid", gap: 16, paddingBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>{TEXT.title}</div>
          <button type="button" onClick={beginCreate} style={primaryButtonStyle}>
            {TEXT.create}
          </button>
        </div>

        {loading && <div style={{ color: "var(--tg-subtle)" }}>{TEXT.loading}</div>}

        {!loading && levels.length === 0 && (
          <div style={{ color: "var(--tg-subtle)" }}>{TEXT.empty}</div>
        )}

        {!loading && levels.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {levels.map((level) => (
              <div key={level.id} style={cardStyle}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 700 }}>Уровень {level.order}</div>
                  <div style={{ color: "var(--tg-subtle)", fontSize: 13 }}>
                    Сниппетов: {level.snippetCount} · XP: {level.xpReward}
                  </div>
                  <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                    {level.isActive ? "Активен" : "Не активен"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => beginEdit(level)} style={ghostButtonStyle}>
                    Редактировать
                  </button>
                  <button type="button" onClick={() => removeLevel(level.id)} style={dangerButtonStyle}>
                    {TEXT.remove}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingId && (
          <div style={cardStyle}>
            <div style={{ fontWeight: 700 }}>Настройки уровня</div>
            <label style={labelStyle}>
              {TEXT.levelOrder}
              <input
                type="number"
                value={order}
                onChange={(event) => setOrder(Number(event.target.value))}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              {TEXT.xpReward}
              <input
                type="number"
                value={xpReward}
                onChange={(event) => setXpReward(Number(event.target.value))}
                style={inputStyle}
              />
            </label>
            <label style={checkboxStyle}>
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
              {TEXT.isActive}
            </label>
            <div style={{ fontWeight: 600 }}>{TEXT.snippets}</div>
            <div style={{ display: "grid", gap: 8, maxHeight: 360, overflowY: "auto" }}>
              {sortedSnippets.map((snippet) => (
                <button
                  key={snippet.id}
                  type="button"
                  onClick={() => toggleSnippet(snippet.id)}
                  style={{
                    ...snippetCardStyle,
                    borderColor: selectedSnippets.includes(snippet.id)
                      ? "rgba(76,196,255,0.8)"
                      : "var(--tg-border)",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{snippet.phrase}</div>
                  {snippet.translation && (
                    <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                      {snippet.translation}
                    </div>
                  )}
                  <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                    Уровни: {snippet.levelOrders.length ? snippet.levelOrders.join(", ") : "—"}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={saveLevel} style={primaryButtonStyle}>
                {TEXT.save}
              </button>
              <button type="button" onClick={() => setEditingId(null)} style={ghostButtonStyle}>
                {TEXT.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const cardStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  padding: 14,
  display: "grid",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-surface)",
  color: "var(--tg-text)",
  padding: "8px 10px",
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 12,
  color: "var(--tg-subtle)",
};

const checkboxStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  fontSize: 13,
  color: "var(--tg-text)",
};

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(76,196,255,0.4)",
  background: "rgba(76,196,255,0.2)",
  color: "var(--tg-text)",
  padding: "6px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const ghostButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--tg-border)",
  background: "transparent",
  color: "var(--tg-text)",
  padding: "6px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const dangerButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,107,107,0.4)",
  background: "rgba(255,107,107,0.1)",
  color: "#ff8a8a",
  padding: "6px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const snippetCardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-surface)",
  color: "var(--tg-text)",
  padding: "10px 12px",
  textAlign: "left",
  display: "grid",
  gap: 4,
};
