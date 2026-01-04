import type { CSSProperties } from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "./Icon";

const linkStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  textDecoration: "none",
  color: "var(--tg-subtle)",
  fontSize: 12,
  fontWeight: 600,
  padding: "6px 8px 2px",
  flex: 1,
  borderRadius: 12,
};

export function NavBar() {
  const items = [
    { to: "/", label: "Главная", icon: "home", iconActive: "home-filled" },
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
      style={{
        position: "fixed",
        bottom: "calc(var(--safe-bottom) - 20px)",
        left: 0,
        right: 0,
        margin: "0 auto",
        maxHeight: "56px",
        maxWidth: 960,
        width: "100%",
        background: "var(--tg-surface)",
        border: "none",
        borderRadius: 0,
        padding: 2,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            ...linkStyle,
            color: "var(--tg-subtle)",
            background: isActive ? "rgba(109, 211, 255, 0.12)" : "transparent",
          })}
        >
          {() => (
            <>
              <Icon
                name={item.icon as any}
                size={22}
                color={"var(--tg-subtle)"}
              />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
