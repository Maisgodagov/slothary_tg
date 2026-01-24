import { useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAuth, setProfile } from "../features/auth/slice";
import { audioPhraseLevelsApi, type AudioPhraseLevelListItem } from "../features/audio-phrase-levels/api";
import { AudioPhraseGameContainer } from "../modules/audio-phrase-game";
import { PageShell } from "../shared/ui/PageShell";
import { PageShellContent } from "../shared/ui/PageShellContent";

export default function AudioPhraseGamePage() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const [levels, setLevels] = useState<AudioPhraseLevelListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [levelReward, setLevelReward] = useState<number | null>(null);

  useEffect(() => {
    if (!auth.profile?.id) return;
    setLoading(true);
    audioPhraseLevelsApi
      .list(auth.profile.id)
      .then((result) => setLevels(result.items))
      .catch(() => setLevels([]))
      .finally(() => setLoading(false));
  }, [auth.profile?.id]);

  return (
    <PageShell pullToRefresh={false} scroll={false} padding={false}>
      <PageShellContent>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            paddingRight: 12,
            paddingLeft: 12,
            flex: 1,
          }}
        >
          {!activeLevelId && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 700 }}>{"Уровни"}</div>
              {loading && (
                <div style={{ color: "var(--tg-subtle)" }}>
                  {"Загружаем..."}
                </div>
              )}
              {!loading && levels.length === 0 && (
                <div style={{ color: "var(--tg-subtle)" }}>
                  {"Уровни пока не созданы."}
                </div>
              )}
              {!loading && levels.length > 0 && (
                <div style={{ display: "grid", gap: 10 }}>
                  {levels.map((level) => {
                    const status = level.progress?.status ?? "NOT_STARTED";
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setActiveLevelId(level.id)}
                        style={{
                          textAlign: "left",
                          borderRadius: 16,
                          border: "1px solid var(--tg-border)",
                          background: "var(--tg-card)",
                          padding: "12px 14px",
                          color: "var(--tg-text)",
                          display: "grid",
                          gap: 6,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>
                          {"Уровень"} {level.order}
                        </div>
                        <div style={{ color: "var(--tg-subtle)", fontSize: 13 }}>
                          {"Сниппетов"}: {level.snippetCount} {"·"} {"Награда"}: {level.xpReward} XP
                        </div>
                        <div style={{ fontSize: 12, color: "var(--tg-subtle)" }}>
                          {"Статус"}: {" "}
                          {status === "COMPLETED"
                            ? "Пройден"
                            : status === "IN_PROGRESS"
                              ? "В процессе"
                              : "Не начат"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeLevelId && (
            <>
              {levelReward !== null && (
                <div style={{ color: "var(--tg-subtle)", alignSelf: "center" }}>
                  {"Получено"}: {levelReward} XP
                </div>
              )}
              <AudioPhraseGameContainer
                userId={auth.profile?.id}
                onXp={(xpPoints) => {
                  if (!auth.profile) return;
                  dispatch(setProfile({ ...auth.profile, xpPoints }));
                }}
                maxRounds={8}
                showHeader={false}
                levelId={activeLevelId}
                onLevelComplete={(reward) => {
                  if (!auth.profile) return;
                  setLevelReward(reward);
                  if (reward) {
                    dispatch(
                      setProfile({
                        ...auth.profile,
                        xpPoints: auth.profile.xpPoints + reward,
                      })
                    );
                  }
                }}
              />
            </>
          )}
        </div>
      </PageShellContent>
    </PageShell>
  );
}
