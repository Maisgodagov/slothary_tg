import type { ReactNode } from "react";

import { Icon } from "../../../shared/ui/Icon";

type WordCardProps = {
  word: string;
  translation: string;
  otherTranslations?: string[];
  showExamplesButton: boolean;
  examplesOpen: boolean;
  onToggleExamples: () => void;
  dictionaryActionLabel: string;
  onDictionaryAction: () => void;
  children?: ReactNode;
};

export function WordCard({
  word,
  translation,
  otherTranslations,
  showExamplesButton,
  examplesOpen,
  onToggleExamples,
  dictionaryActionLabel,
  onDictionaryAction,
  children,
}: WordCardProps) {
  const showOther = Boolean(otherTranslations && otherTranslations.length > 0);

  return (
    <div
      style={{
        background: "var(--tg-surface)",
        border: "1px solid var(--tg-border)",
        borderRadius: 16,
        padding: 16,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 8,
          textAlign: "center",
          color: "var(--tg-text)",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800 }}>
          <span>{word}</span>
          {translation && (
            <span style={{ fontWeight: 400 }}> - {translation}</span>
          )}
        </div>
        {showOther && (
          <div
            style={{
              fontSize: 13,
              color: "var(--tg-subtle)",
            }}
          >
            др. переводы: {otherTranslations!.join(", ")}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {showExamplesButton && (
          <button
            type="button"
            onClick={onToggleExamples}
            style={{
              border: "1px solid var(--tg-border)",
              background: "var(--tg-card)",
              color: "var(--tg-text)",
              fontWeight: 700,
              fontSize: 16,
              borderRadius: 999,
              padding: "8px 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            Примеры
            <Icon
              name="chevron-down"
              size={16}
              style={{
                transform: examplesOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease",
              }}
            />
          </button>
        )}
        <button
          type="button"
          onClick={onDictionaryAction}
          style={{
            border: "1px solid var(--tg-border)",
            background: "var(--tg-card)",
            color: "var(--tg-text)",
            fontWeight: 700,
            fontSize: 16,
            borderRadius: 999,
            padding: "8px 14px",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          {dictionaryActionLabel}
        </button>
      </div>

      {children}
    </div>
  );
}
