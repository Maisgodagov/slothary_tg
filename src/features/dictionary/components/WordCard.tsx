import type { ReactNode } from "react";

import { Icon } from "../../../shared/ui/Icon";

type WordCardProps = {
  word: string;
  translation: string;
  otherTranslationsRu?: string[];
  synonyms?: string[];
  onSynonymClick?: (value: string) => void;
  size?: "default" | "subtitle";
  showExamplesButton: boolean;
  examplesOpen: boolean;
  onToggleExamples: () => void;
  dictionaryActionLabel?: string;
  dictionaryActionMode?: "button" | "tag" | "none";
  dictionaryActionDisabled?: boolean;
  onDictionaryAction?: () => void;
  dictionaryActionPlacement?: "footer" | "inline";
  dictionaryActionVisibility?: "always" | "expanded-only";
  isExpanded?: boolean;
  layoutMode?: "default" | "tight";
  variant?: "default" | "compact";
  summary?: boolean;
  children?: ReactNode;
};

export function WordCard({
  word,
  translation,
  otherTranslationsRu,
  synonyms,
  onSynonymClick,
  size = "default",
  showExamplesButton,
  examplesOpen,
  onToggleExamples,
  dictionaryActionLabel,
  dictionaryActionMode = "button",
  dictionaryActionDisabled = false,
  onDictionaryAction,
  dictionaryActionPlacement = "footer",
  dictionaryActionVisibility = "always",
  isExpanded = false,
  layoutMode = "default",
  variant = "default",
  summary = false,
  children,
}: WordCardProps) {
  const showOtherTranslations = Boolean(
    otherTranslationsRu && otherTranslationsRu.length > 0,
  );
  const showSynonyms = Boolean(synonyms && synonyms.length > 0);
  const isCompact = variant === "compact";
  const isSubtitle = size === "subtitle";
  const canShowDictionaryAction =
    dictionaryActionMode !== "none" && Boolean(dictionaryActionLabel);
  const showDictionaryAction =
    canShowDictionaryAction &&
    (dictionaryActionVisibility === "always" || isExpanded);
  const showInlineAction =
    showDictionaryAction && dictionaryActionPlacement === "inline";
  const showFooterAction =
    showDictionaryAction && dictionaryActionPlacement !== "inline";
  const displayWord = word.toLowerCase();
  const effectiveLayout = summary ? "tight" : layoutMode;
  const outerGap = effectiveLayout === "tight" ? 5 : isSubtitle ? 8 : isCompact ? 10 : 14;

  const wordFontSize = isSubtitle ? 16 : isCompact ? 18 : 28;
  const metaFontSize = isSubtitle ? 12 : isCompact ? 13 : 14;
  const buttonFontSize = isSubtitle ? 12 : isCompact ? 12 : 14;
  const actionsJustify =
    isSubtitle && !showExamplesButton
      ? "flex-end"
      : isCompact
        ? "flex-start"
        : "space-between";

  return (
    <div
      style={{
        background: "var(--tg-surface)",
        border: "1px solid var(--tg-border)",
        borderRadius: 16,
        padding: isSubtitle ? 10 : effectiveLayout === "tight" ? 12 : 16,
        display: "grid",
        gap: outerGap,
      }}
    >
      <div
        style={{
          display: "grid",
          gap: isSubtitle ? 6 : isCompact ? 4 : 12,
          textAlign: "left",
          color: "var(--tg-text)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: showInlineAction ? "space-between" : "flex-start",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: wordFontSize,
              fontWeight: 800,
              lineHeight: isSubtitle ? 1.2 : 1.25,
            }}
          >
            <span>{displayWord}</span>
            {translation && (
              <span style={{ fontWeight: 400 }}> - {translation}</span>
            )}
          </div>
          {showInlineAction &&
            (dictionaryActionMode === "tag" ? (
              <span
                style={{
                  border: "1px solid var(--tg-border)",
                  background: "var(--tg-card)",
                  color: "var(--tg-text)",
                  fontWeight: 700,
                  fontSize: buttonFontSize,
                  borderRadius: 999,
                  padding: isCompact ? "6px 12px" : "8px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: 0.7,
                  whiteSpace: "nowrap",
                }}
              >
                {dictionaryActionLabel}
              </span>
            ) : (
              <button
                type="button"
                onClick={
                  dictionaryActionDisabled ? undefined : onDictionaryAction
                }
                disabled={dictionaryActionDisabled}
                style={{
                  border: "1px solid var(--tg-border)",
                  background: "var(--tg-card)",
                  color: "var(--tg-text)",
                  fontWeight: 700,
                  fontSize: buttonFontSize,
                  borderRadius: 999,
                  padding: isCompact ? "6px 12px" : "8px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: dictionaryActionDisabled ? "default" : "pointer",
                  opacity: dictionaryActionDisabled ? 0.6 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {dictionaryActionLabel}
              </button>
            ))}
        </div>
        {showOtherTranslations && (
          <div
            style={{
              fontSize: metaFontSize,
              color: "var(--tg-subtle)",
            }}
          >
            {otherTranslationsRu!.join(", ")}
          </div>
        )}
        {showSynonyms && (
          <div
            style={{
              fontSize: metaFontSize,
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

      {(showExamplesButton || showFooterAction) && !summary && (
        <div
          style={{
            display: "flex",
            gap: isCompact ? 10 : 14,
            justifyContent: actionsJustify,
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
                fontSize: buttonFontSize,
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
          {showFooterAction &&
            (dictionaryActionMode === "tag" ? (
              <span
                style={{
                  border: "1px solid var(--tg-border)",
                  background: "var(--tg-card)",
                  color: "var(--tg-text)",
                  fontWeight: 700,
                  fontSize: buttonFontSize,
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
                onClick={
                  dictionaryActionDisabled ? undefined : onDictionaryAction
                }
                disabled={dictionaryActionDisabled}
                style={{
                  border: "1px solid var(--tg-border)",
                  background: "var(--tg-card)",
                  color: "var(--tg-text)",
                  fontWeight: 700,
                  fontSize: buttonFontSize,
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
      )}

      {children}
    </div>
  );
}
