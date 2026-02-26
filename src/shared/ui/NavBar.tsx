import type { CSSProperties } from "react";
import { NavLink } from "react-router-dom";

import { useAppSelector } from "../../app/hooks";
import { selectAuth } from "../../features/auth/slice";
import { Icon } from "./Icon";

const linkStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 0,
  textDecoration: "none",
  color: "var(--tg-subtle)",
  fontSize: 0,
  fontWeight: 600,
  padding: "6px 8px",
  width: "calc(100% - 24px)",
  justifySelf: "center",
  borderRadius: 22,
};

export function NavBar() {
  const auth = useAppSelector(selectAuth);
  const isAdmin = auth.profile?.role === "admin";

  const items = [
    { to: "/", label: "Главная", icon: "home", iconActive: "home-filled" },
    ...(isAdmin
      ? [{ to: "/training", label: "Учить", icon: "exercise", iconActive: "exercise-filled" as const }]
      : []),
    { to: "/video", label: "Видео", icon: "video", iconActive: "video-filled" },
    {
      to: "/dictionary",
      label: "Словарь",
      icon: "dictionary",
      iconActive: "dictionary-filled",
    },
  ] as const;

  return (
    <nav
      className="app-navbar"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        margin: "0 auto",
        height: "54px",
        minHeight: "54px",
        maxHeight: "54px",
        maxWidth: 960,
        width: "100%",
        background: "var(--tg-surface)",
        border: "none",
        borderRadius: 0,
        padding: 2,
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        zIndex: 20,
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            ...linkStyle,
            color: isActive ? "#FFFFFF" : "var(--tg-subtle)",
            background: isActive ? "var(--tg-button-primary-bg)" : "transparent",
          })}
        >
          {({ isActive }) => (
            <>
              <Icon
                name={item.icon as any}
                size={22}
                color={isActive ? "#FFFFFF" : "var(--tg-subtle)"}
              />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
