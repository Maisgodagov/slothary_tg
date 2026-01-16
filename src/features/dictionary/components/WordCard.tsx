import type { ReactNode } from "react";

import { Icon } from "../../../shared/ui/Icon";

type WordCardProps = {
  word: string;
  translation: string;
  otherTranslationsRu?: string[];
  synonyms?: string[];
  onSynonymClick?: (value: string) => void;
  showExamplesButton: boolean;
  examplesOpen: boolean;
  onToggleExamples: () => void;
  dictionaryActionLabel?: string;
  dictionaryActionMode?: "button" | "tag" | "none";
  dictionaryActionDisabled?: boolean;
  onDictionaryAction?: () => void;
  variant?: "default" | "compact";
  children?: ReactNode;
};

export function WordCard({
  word,
  translation,
  otherTranslationsRu,
  synonyms,
  onSynonymClick,
  showExamplesButton,
  examplesOpen,
  onToggleExamples,
  dictionaryActionLabel,
  dictionaryActionMode = "button",
  dictionaryActionDisabled = false,
  onDictionaryAction,
  variant = "default",
  children,
}: WordCardProps) {
  const showOtherTranslations = Boolean(
    otherTranslationsRu && otherTranslationsRu.length > 0
  );
  const showSynonyms = Boolean(synonyms && synonyms.length > 0);
  const isCompact = variant === "compact";
  const showDictionaryAction =
    dictionaryActionMode !== "none" && Boolean(dictionaryActionLabel);
  const displayWord = word.toLowerCase();

  return (
    <div
      style={{
        background: "var(--tg-surface)",
        border: "1px solid var(--tg-border)",
        borderRadius: 16,
        padding: 16,
        display: "grid",
        gap: isCompact ? 10 : 14,
      }}
    >
      <div
        style={{
          display: "grid",
          gap: isCompact ? 8 : 12,
          textAlign: "left",
          color: "var(--tg-text)",
        }}
      >
        <div
          style={{
            fontSize: isCompact ? 18 : 28,
            fontWeight: 800,
            lineHeight: 1.25,
          }}
        >
          <span>{displayWord}</span>
          {translation && (
            <span style={{ fontWeight: 400 }}> - {translation}</span>
          )}
        </div>
        {showOtherTranslations && (
          <div
            style={{
              fontSize: isCompact ? 13 : 14,
              color: "var(--tg-subtle)",
            }}
          >
            <span style={{ fontWeight: 700 }}>др. переводы:</span>{" "}
            {otherTranslationsRu!.join(", ")}
          </div>
        )}
        {showSynonyms && (
          <div
            style={{
              fontSize: isCompact ? 13 : 14,
              color: "var(--tg-subtle)",
            }}
          >
            <span style={{ fontWeight: 700 }}>синонимы:</span>{" "}
            {synonyms!.map((value, index) => (
              <span key={value}>
                {index > 0 ? ", " : ""}
                {onSynonymClick ? (
                  <button
                    type="button"
                    onClick={() => onSynonymClick(value)}
                    style={{
                      border: "none",
                      background: "none",
                      padding: 0,
                      margin: 0,
                      color: "inherit",
                      font: "inherit",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {value}
                  </button>
                ) : (
                  value
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: isCompact ? 10 : 14,
          justifyContent: isCompact ? "flex-start" : "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          width: "100%",
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
              fontSize: isCompact ? 12 : 14,
              borderRadius: 999,
              padding: isCompact ? "6px 12px" : "8px 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            {examplesOpen ? "Скрыть примеры" : "Показать примеры"}
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
        {showDictionaryAction &&
          (dictionaryActionMode === "tag" ? (
            <span
              style={{
                border: "1px solid var(--tg-border)",
                background: "var(--tg-card)",
                color: "var(--tg-text)",
                fontWeight: 700,
                fontSize: isCompact ? 12 : 14,
                borderRadius: 999,
                padding: isCompact ? "6px 12px" : "8px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                opacity: 0.7,
              }}
            >
              {dictionaryActionLabel}
            </span>
          ) : (
            <button
              type="button"
              onClick={dictionaryActionDisabled ? undefined : onDictionaryAction}
              disabled={dictionaryActionDisabled}
              style={{
                border: "1px solid var(--tg-border)",
                background: "var(--tg-card)",
                color: "var(--tg-text)",
                fontWeight: 700,
                fontSize: isCompact ? 12 : 14,
                borderRadius: 999,
                padding: isCompact ? "6px 12px" : "8px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: dictionaryActionDisabled ? "default" : "pointer",
                opacity: dictionaryActionDisabled ? 0.6 : 1,
              }}
            >
              {dictionaryActionLabel}
            </button>
          ))}
      </div>

      {children}
    </div>
  );
}
