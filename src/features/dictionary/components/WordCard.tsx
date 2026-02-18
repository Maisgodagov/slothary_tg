import type { ReactNode } from "react";

import { Icon } from "../../../shared/ui/Icon";

type WordCardProps = {
  word: string;
  translation: string;
  cefrLevel?: string | null;
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
  reading?: boolean;
  shareActionLabel?: ReactNode;
  shareActionLoading?: boolean;
  onShare?: () => void;
  showPronunciationButton?: boolean;
  onPlayPronunciation?: () => void;
  deleteActionLabel?: string;
  deleteActionDisabled?: boolean;
  onDeleteAction?: () => void;
  children?: ReactNode;
};

export function WordCard({
  word,
  translation,
  cefrLevel,
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
  reading = false,
  shareActionLabel,
  shareActionLoading = false,
  onShare,
  showPronunciationButton = false,
  onPlayPronunciation,
  deleteActionLabel,
  deleteActionDisabled = false,
  onDeleteAction,
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
  const showShareAction = Boolean(shareActionLabel && onShare);
  const canPlayPronunciation = Boolean(showPronunciationButton && onPlayPronunciation);
  const showDeleteAction = Boolean(deleteActionLabel && onDeleteAction);
  const hasMainActionButtons =
    showDeleteAction || canPlayPronunciation || showFooterAction;
  const pinShareToRight = showShareAction && hasMainActionButtons;
  const dictionaryLabelText = (dictionaryActionLabel ?? "").replace(/^\+\s*/, "");
  const displayWord = word.toLowerCase();
  const normalizedCefrLevel = (cefrLevel ?? "").trim().toUpperCase();
  const showCefrLevel = /^(A1|A2|B1|B2|C1|C2)$/.test(normalizedCefrLevel);
  const effectiveLayout = summary ? "tight" : layoutMode;
  const outerGap = effectiveLayout === "tight" ? 5 : isSubtitle ? 8 : isCompact ? 10 : 14;

  const wordFontSize = isSubtitle ? 15 : isCompact ? 17 : 26;
  const metaFontSize = isSubtitle ? 12 : isCompact ? 13 : 14;
  const buttonFontSize = reading ? 11 : isSubtitle ? 12 : isCompact ? 12 : 14;
  const actionsJustify =
    reading
      ? "space-between"
      : isSubtitle && !showExamplesButton
      ? "flex-end"
      : isCompact
        ? "flex-start"
        : "space-between";

  const examplesLabel = reading
    ? examplesOpen
      ? "Скрыть примеры"
      : "Видео примеры"
    : examplesOpen
      ? "Скрыть примеры"
      : "Показать примеры";

  return (
    <div
      style={{
        background: "var(--tg-card-strong)",
        border: "none",
        borderRadius: 20,
        padding: isSubtitle ? 10 : effectiveLayout === "tight" ? 12 : 16,
        display: "grid",
        gap: outerGap,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: isSubtitle ? 6 : isCompact ? 4 : 12,
          textAlign: "left",
          color: "var(--tg-text)",
          paddingRight: showCefrLevel ? 56 : 0,
        }}
      >
        {showCefrLevel && (
          <div
            style={{
              position: "absolute",
              top: isSubtitle ? 10 : effectiveLayout === "tight" ? 12 : 16,
              right: isSubtitle ? 10 : effectiveLayout === "tight" ? 12 : 16,
              color: "var(--tg-text)",
              fontWeight: 700,
              fontSize: isSubtitle ? 11 : 12,
              lineHeight: 1,
              letterSpacing: "0.02em",
            }}
          >
            {normalizedCefrLevel}
          </div>
        )}
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
                  lineHeight: 1,
                  borderRadius: 999,
                  padding: isCompact ? "6px 12px" : "8px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: 0.7,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  <Icon name="check" size={14} />
                </span>
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
                  lineHeight: 1,
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
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  <Icon
                    name={dictionaryActionDisabled ? "check" : "plus"}
                    size={14}
                  />
                </span>
                {dictionaryLabelText}
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
            gap: pinShareToRight ? (isCompact ? 8 : 10) : isCompact ? 10 : 14,
            justifyContent: pinShareToRight ? "flex-start" : actionsJustify,
            alignItems: "center",
            flexWrap: reading ? "nowrap" : "wrap",
            width: "100%",
          }}
        >
          {showExamplesButton && (
            showShareAction ? (
              <></>
            ) : (
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
                {examplesLabel}
                <Icon
                  name="chevron-down"
                  size={16}
                  style={{
                    transform: examplesOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.15s ease",
                  }}
                />
              </button>
            )
          )}
          {showDeleteAction && (
            <button
              type="button"
              onClick={deleteActionDisabled ? undefined : onDeleteAction}
              disabled={deleteActionDisabled}
              style={{
                border: "1px solid var(--tg-border)",
                background: "var(--tg-card)",
                color: "var(--tg-text)",
                fontWeight: 700,
                fontSize: buttonFontSize,
                lineHeight: 1,
                borderRadius: 999,
                padding: isCompact ? "6px 12px" : "8px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: deleteActionDisabled ? "default" : "pointer",
                opacity: deleteActionDisabled ? 0.6 : 1,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <Icon name="trash" size={14} />
              </span>
              {deleteActionLabel}
            </button>
          )}
          {canPlayPronunciation && (
            <button
              type="button"
              onClick={onPlayPronunciation}
              style={{
                border: "1px solid var(--tg-border)",
                background: "var(--tg-card)",
                color: "var(--tg-text)",
                fontWeight: 700,
                fontSize: buttonFontSize,
                lineHeight: 1,
                borderRadius: 999,
                padding: isCompact ? "6px 12px" : "8px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
              aria-label="Воспроизвести произношение"
            >
              <Icon name="volume-on" size={16} />
              произношение
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
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  <Icon name="check" size={14} />
                </span>
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
                  lineHeight: 1,
                  borderRadius: 999,
                  padding: isCompact ? "6px 12px" : "8px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: dictionaryActionDisabled ? "default" : "pointer",
                  opacity: dictionaryActionDisabled ? 0.6 : 1,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  <Icon
                    name={dictionaryActionDisabled ? "check" : "plus"}
                    size={14}
                  />
                </span>
                {dictionaryLabelText}
              </button>
            ))}
          {showShareAction && (
            <button
              type="button"
              onClick={shareActionLoading ? undefined : onShare}
              style={{
                border: "1px solid var(--tg-border)",
                background: "var(--tg-card)",
                color: "var(--tg-text)",
                borderRadius: 999,
                width: isCompact ? 32 : 36,
                height: isCompact ? 32 : 36,
                padding: 0,
                display: "inline-grid",
                placeItems: "center",
                cursor: shareActionLoading ? "default" : "pointer",
                opacity: shareActionLoading ? 0.6 : 1,
                marginLeft: pinShareToRight ? "auto" : 0,
              }}
              aria-label="Поделиться"
            >
              {shareActionLabel ?? <Icon name="forward" size={14} />}
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
