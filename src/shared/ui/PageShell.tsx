import type { ReactNode } from "react";
import { NavBar } from "./NavBar";

type PageShellProps = {
  children: ReactNode;
  scroll?: boolean;
  padding?: boolean;
  withNav?: boolean;
  className?: string;
};

export function PageShell({
  children,
  scroll = true,
  padding = true,
  withNav = true,
  className,
}: PageShellProps) {
  const contentClasses = [
    "page-shell__content",
    scroll ? "page-shell__content--scroll" : "page-shell__content--no-scroll",
    padding ? "page-shell__content--pad" : "page-shell__content--no-pad",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["page-shell", className].filter(Boolean).join(" ")}>
      <div className={contentClasses}>{children}</div>
      {withNav && <NavBar />}
    </div>
  );
}
