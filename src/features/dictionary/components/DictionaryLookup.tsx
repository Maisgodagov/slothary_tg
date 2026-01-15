import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { selectAuth } from "../../auth/slice";
import { addWord, fetchDictionary, selectDictionary } from "../slice";

export function DictionaryLookup() {
  const dispatch = useAppDispatch();
  const dictionary = useAppSelector(selectDictionary);
  const auth = useAppSelector(selectAuth);
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<"en" | "ru">("en");

  useEffect(() => {
    if (auth.profile?.id && dictionary.items.length === 0) {
      dispatch(fetchDictionary());
    }
  }, [auth.profile?.id, dictionary.items.length, dispatch]);

  if (!auth.profile) {
    return (
      <div className="section">
        <div className="section-header">
          <h3 style={{ margin: 0 }}>Словарь</h3>
        </div>
        <div style={{ color: "var(--tg-subtle)" }}>
          Войдите, чтобы просматривать сохраненные слова.
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-header">
        <h3 style={{ margin: 0 }}>Словарь</h3>
        <Button variant="ghost" onClick={() => dispatch(fetchDictionary())}>
          Обновить
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!query.trim()) return;
          dispatch(addWord({ query: query.trim(), lang }));
          setQuery("");
        }}
        style={{ display: "grid", gap: 8, marginBottom: 10 }}
      >
        <Input
          label="Слово"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="word or слово"
          required
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="button"
            variant={lang === "en" ? "primary" : "ghost"}
            onClick={() => setLang("en")}
          >
            EN
          </Button>
          <Button
            type="button"
            variant={lang === "ru" ? "primary" : "ghost"}
            onClick={() => setLang("ru")}
          >
            RU
          </Button>
          <Button type="submit" variant="primary">
            Добавить
          </Button>
        </div>
      </form>

      {dictionary.status === "loading" && (
        <div style={{ color: "var(--tg-subtle)" }}>Загрузка...</div>
      )}
      {dictionary.error && (
        <div style={{ color: "var(--tg-danger)" }}>{dictionary.error}</div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {dictionary.items.map((entry) => (
          <div
            key={entry.id}
            style={{
              padding: 10,
              borderRadius: 12,
              border: "1px solid var(--tg-border)",
              background: "var(--tg-card)",
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {entry.word} - {entry.translation}
            </div>
            {entry.otherTranslations && entry.otherTranslations.length > 0 && (
              <div style={{ color: "var(--tg-subtle)", fontSize: 12 }}>
                др. переводы: {entry.otherTranslations.join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
