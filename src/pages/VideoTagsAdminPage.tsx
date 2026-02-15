import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import { moderationApi, type VideoTagSummary } from "../features/video-feed/moderationApi";
import { PageShell } from "../shared/ui/PageShell";

export default function VideoTagsAdminPage() {
  const auth = useAppSelector(selectAuth);
  const isAdmin = auth.profile?.role === "admin";
  const [data, setData] = useState<VideoTagSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  const loadTags = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const result = await moderationApi.getTags(
        auth.profile?.id,
        auth.profile?.role,
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить теги");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, auth.profile?.id, auth.profile?.role]);

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={wrapperStyle}>
          <div style={titleStyle}>Теги видео</div>
          <div style={{ color: "var(--tg-subtle)" }}>
            Доступно только для администратора.
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={wrapperStyle}>
        <div className="page-header" style={titleStyle}>
          Видео
        </div>

        <div style={statsGrid}>
          <StatCard title="Всего видео" value={String(data?.totalVideos ?? 0)} />
          <StatCard
            title="С тегами"
            value={String(data?.videosWithTags ?? 0)}
          />
          <StatCard
            title="Без тегов"
            value={String(data?.videosWithoutTags ?? 0)}
          />
          <StatCard
            title="Промодерировано"
            value={String(data?.moderatedVideos ?? 0)}
          />
          <StatCard
            title="Не промодерировано"
            value={String(data?.unmoderatedVideos ?? 0)}
          />
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Создать тег</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
              placeholder="Например: Гарри Поттер"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              style={buttonPrimaryStyle}
              disabled={saving || !newTag.trim()}
              onClick={async () => {
                if (!newTag.trim()) return;
                try {
                  setSaving(true);
                  await moderationApi.createTag(
                    newTag.trim(),
                    auth.profile?.id,
                    auth.profile?.role,
                  );
                  setNewTag("");
                  await loadTags();
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Не удалось создать тег",
                  );
                } finally {
                  setSaving(false);
                }
              }}
            >
              Добавить
            </button>
          </div>
        </div>

        {error && <div style={errorStyle}>{error}</div>}
        {loading && <div style={{ color: "var(--tg-subtle)" }}>Загрузка...</div>}

        {!!data?.tags?.length && (
          <div style={{ display: "grid", gap: 10 }}>
            {data.tags.map((tag) => (
              <div key={tag.id} style={tagRowStyle}>
                <div>
                  <div style={{ fontWeight: 700 }}>{tag.name}</div>
                  <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                    Видео с тегом: {tag.usageCount}
                  </div>
                </div>
                <button
                  type="button"
                  style={buttonDangerStyle}
                  disabled={saving}
                  onClick={async () => {
                    if (!window.confirm(`Удалить тег "${tag.name}"?`)) return;
                    try {
                      setSaving(true);
                      await moderationApi.deleteTag(
                        tag.id,
                        auth.profile?.id,
                        auth.profile?.role,
                      );
                      await loadTags();
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Не удалось удалить тег",
                      );
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const wrapperStyle: CSSProperties = {
  paddingLeft: 12,
  paddingRight: 12,
  paddingBottom: 70,
  display: "grid",
  gap: 12,
};

const titleStyle: CSSProperties = {
  fontWeight: 700,
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const cardStyle: CSSProperties = {
  border: "1px solid var(--tg-border)",
  background: "var(--tg-card)",
  borderRadius: 14,
  padding: 12,
};

const inputStyle: CSSProperties = {
  borderRadius: 10,
  border: "1px solid var(--tg-border)",
  background: "var(--tg-surface)",
  color: "var(--tg-text)",
  padding: "9px 10px",
  fontSize: 14,
};

const buttonPrimaryStyle: CSSProperties = {
  borderRadius: 10,
  border: "1px solid var(--tg-link)",
  background: "var(--tg-link)",
  color: "var(--tg-button-text, #fff)",
  padding: "8px 12px",
  fontWeight: 700,
  cursor: "pointer",
};

const buttonDangerStyle: CSSProperties = {
  borderRadius: 10,
  border: "1px solid #d84f67",
  background: "transparent",
  color: "#d84f67",
  padding: "8px 12px",
  fontWeight: 700,
  cursor: "pointer",
};

const tagRowStyle: CSSProperties = {
  ...cardStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const errorStyle: CSSProperties = {
  color: "#d84f67",
  fontSize: 13,
};
