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
  padding: "8px 10px",
  flex: 1,
  borderRadius: 12,
};

export function NavBar() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: "calc(var(--safe-bottom) + 4px)",
        left: 0,
        right: 0,
        margin: "0 auto",
        maxWidth: 960,
        width: "100%",
        background: "rgba(23, 26, 39, 0.9)",
        border: "1px solid var(--tg-border)",
        borderRadius: 14,
        padding: 4,
        boxShadow: "0 6px 20px rgba(0,0,0,0.28)",
        backdropFilter: "blur(5px)",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        zIndex: 10,
      }}
    >
      <NavLink
        to="/"
        style={({ isActive }) => ({
          ...linkStyle,
          color: isActive ? "var(--tg-text)" : linkStyle.color,
          background: isActive ? "rgba(109, 211, 255, 0.12)" : "transparent",
        })}
      >
        <Icon name="home" size={22} />
        Лента
      </NavLink>
      <NavLink
        to="/dictionary"
        style={({ isActive }) => ({
          ...linkStyle,
          color: isActive ? "var(--tg-text)" : linkStyle.color,
          background: isActive ? "rgba(109, 211, 255, 0.12)" : "transparent",
        })}
      >
        <Icon name="dictionary" size={22} />
        Словарь
      </NavLink>
      <NavLink
        to="/profile"
        style={({ isActive }) => ({
          ...linkStyle,
          color: isActive ? "var(--tg-text)" : linkStyle.color,
          background: isActive ? "rgba(109, 211, 255, 0.12)" : "transparent",
        })}
      >
        <Icon name="profile" size={22} />
        Профиль
      </NavLink>
      <NavLink
        to="/admin"
        style={({ isActive }) => ({
          ...linkStyle,
          color: isActive ? "var(--tg-text)" : linkStyle.color,
          background: isActive ? "rgba(255, 200, 87, 0.12)" : "transparent",
        })}
      >
        <Icon name="admin" size={22} />
        Админ
      </NavLink>
    </nav>
  );
}
