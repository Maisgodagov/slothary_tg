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
      background: "linear-gradient(135deg, #2ea3ff, #6dd3ff)",
      color: "#0c1021",
      boxShadow: "0 10px 30px rgba(46, 163, 255, 0.3)",
    },
    ghost: {
      ...common,
      background: "rgba(255,255,255,0.04)",
      color: "var(--tg-text)",
      borderColor: "var(--tg-border)",
    },
    danger: {
      ...common,
      background: "linear-gradient(135deg, #ff5f6d, #ff9966)",
      color: "#0c1021",
      boxShadow: "0 10px 30px rgba(255, 95, 109, 0.3)",
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
      {loading ? "Загрузка..." : children}
    </button>
  );
}
