import type { ReactNode } from "react";

type PageShellContentProps = {
  children: ReactNode;
  className?: string;
};

export function PageShellContent({ children, className }: PageShellContentProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}
