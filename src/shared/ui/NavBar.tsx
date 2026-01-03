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
  padding: "6px 8px",
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
        maxWidth: 960,
        width: "100%",
        background: "rgba(230, 143, 62, 0.9)",
        border: "none",
        borderRadius: 0,
        padding: 2,
        boxShadow: "0 6px 20px rgba(0,0,0,0.28)",
        backdropFilter: "blur(5px)",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        zIndex: 1000,
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            ...linkStyle,
            color: isActive ? "var(--tg-text)" : (linkStyle.color as string),
            background: isActive ? "rgba(109, 211, 255, 0.12)" : "transparent",
          })}
        >
          {({ isActive }) => (
            <>
              <Icon
                name={(isActive ? item.iconActive : item.icon) as any}
                size={22}
                color={isActive ? "#fff" : (linkStyle.color as string)}
              />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
