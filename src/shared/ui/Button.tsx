import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
}

const getStyles = (variant: Variant) => {
  const common = {
    border: "1px solid transparent",
    borderRadius: 12,
    padding: "6px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition:
      "transform 120ms ease, opacity 120ms ease, box-shadow 180ms ease",
  } as const;

  const variants: Record<Variant, CSSProperties> = {
    primary: {
      ...common,
      background: "var(--tg-button-primary-bg)",
      color: "var(--tg-button-primary-text)",
      borderColor: "var(--tg-button-primary-border)",
      boxShadow: "0 4px 0 var(--tg-button-primary-shadow), 0 8px 14px var(--tg-shadow-strong)",
    },
    ghost: {
      ...common,
      background: "var(--tg-button-neutral-bg)",
      color: "var(--tg-button-neutral-text)",
      borderColor: "var(--tg-button-neutral-border)",
      boxShadow: "0 4px 0 var(--tg-button-neutral-shadow), 0 8px 14px var(--tg-shadow-soft)",
    },
    danger: {
      ...common,
      background: "var(--tg-button-negative-bg)",
      color: "var(--tg-button-negative-text)",
      borderColor: "var(--tg-button-negative-border)",
      boxShadow: "0 4px 0 var(--tg-button-negative-shadow), 0 8px 14px var(--tg-shadow-strong)",
    },
  };

  return variants[variant];
};

export function Button({
  children,
  variant = "primary",
  loading,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      style={{
        ...getStyles(variant),
        ...style,
        opacity: disabled || loading ? 0.7 : 1,
      }}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Р—Р°РіСЂСѓР·РєР°..." : children}
    </button>
  );
}

