import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAuth, setProfile } from "../features/auth/slice";
import AudioPhraseGame from "../features/audio-phrase-game/AudioPhraseGame";
import { PageShell } from "../shared/ui/PageShell";

const TEXT = {
  adminOnly:
    "\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u0442\u043e\u043b\u044c\u043a\u043e \u0434\u043b\u044f \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430.",
};

export default function AudioPhraseGamePage() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const isAdmin = auth.profile?.role === "admin";

  if (!isAdmin) {
    return (
      <PageShell>
        <div style={{ padding: 16, color: "var(--tg-subtle)" }}>
          {TEXT.adminOnly}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          paddingRight: 12,
          paddingLeft: 12,
        }}
      >
        <AudioPhraseGame
          userId={auth.profile?.id}
          onXp={(xpPoints) => {
            if (!auth.profile) return;
            dispatch(setProfile({ ...auth.profile, xpPoints }));
          }}
          maxRounds={20}
          showHeader={false}
          showSkip={isAdmin}
        />
      </div>
    </PageShell>
  );
}
