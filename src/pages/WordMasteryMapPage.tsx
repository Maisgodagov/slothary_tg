import { useEffect, useMemo, useState } from "react";

import { useAppSelector } from "../app/hooks";
import { selectAuth } from "../features/auth/slice";
import { apiFetch } from "../shared/api/client";
import { PageShell } from "../shared/ui/PageShell";

type Mastery = "known" | "learning" | "new";

interface MasteryItem {
  id: number;
  word: string;
  cefrLevel: string;
  mastery: Mastery;
}

interface MasteryMapResponse {
  items: MasteryItem[];
  byLevel: Record<string, { total: number; known: number; learning: number; new: number }>;
}

const CELL_BG: Record<Mastery, string> = {
  known: "#2ac46f",
  learning: "#f2c94c",
  new: "rgba(255,255,255,0.16)",
};

export default function WordMasteryMapPage() {
  const auth = useAppSelector(selectAuth);
  const [data, setData] = useState<MasteryMapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.profile?.id || auth.profile?.role !== "admin") return;
    setLoading(true);
    setError(null);
    apiFetch<MasteryMapResponse>("admin/word-training-snippets/mastery-map", {
      headers: {
        "x-user-id": auth.profile.id,
        "x-user-role": "admin",
      },
    })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Не удалось загрузить карту"))
      .finally(() => setLoading(false));
  }, [auth.profile?.id, auth.profile?.role]);

  const levelOrder = useMemo(() => ["A1", "A2", "B1", "B2", "C1", "C2"], []);
  const itemsByLevel = useMemo(() => {
    const grouped: Record<string, MasteryItem[]> = {};
    for (const level of levelOrder) grouped[level] = [];
    for (const item of data?.items ?? []) {
      const level = (item.cefrLevel ?? "").toUpperCase();
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(item);
    }
    return grouped;
  }, [data?.items, levelOrder]);

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 12, padding: "0 12px 70px" }}>
        {loading && <div style={{ color: "var(--tg-subtitle-text-color)" }}>Загрузка карты...</div>}
        {error && <div style={{ color: "#ff6b7a", fontWeight: 700 }}>{error}</div>}

        {data && (
          <section
            style={{
              borderRadius: 18,
              border: "1px solid var(--tg-border)",
              background: "var(--tg-card-strong)",
              padding: 12,
              display: "grid",
              gap: 14,
            }}
          >
            {levelOrder.map((level) => {
              const levelItems = itemsByLevel[level] ?? [];
              const levelStats = data.byLevel[level];
              if (!levelStats || levelItems.length === 0) return null;
              return (
                <div key={level} style={{ display: "grid", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>Уровень {level}</div>
                    <div style={{ fontSize: 12, color: "var(--tg-subtitle-text-color)" }}>
                      {levelStats.known}/{levelStats.total}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(20, minmax(0, 1fr))",
                      gap: 4,
                    }}
                  >
                    {levelItems.map((item) => (
                      <div
                        key={item.id}
                        title={`${item.word} (${item.cefrLevel})`}
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          borderRadius: 4,
                          background: CELL_BG[item.mastery],
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </PageShell>
  );
}
