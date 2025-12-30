import type { CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';

const linkStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  textDecoration: 'none',
  color: 'var(--tg-subtle)',
  fontSize: 12,
  fontWeight: 600,
  padding: '10px 12px',
  flex: 1,
  borderRadius: 12,
};

export function NavBar() {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'clamp(320px, 94vw, 960px)',
        background: 'rgba(23, 26, 39, 0.95)',
        border: '1px solid var(--tg-border)',
        borderRadius: 16,
        padding: 8,
        boxShadow: '0 12px 50px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        zIndex: 10,
      }}
    >
      <NavLink
        to="/"
        style={({ isActive }) => ({
          ...linkStyle,
          color: isActive ? 'var(--tg-text)' : linkStyle.color,
          background: isActive ? 'rgba(109, 211, 255, 0.12)' : 'transparent',
        })}
      >
        <span role="img" aria-label="feed">
          🎬
        </span>
        Лента
      </NavLink>
      <NavLink
        to="/dictionary"
        style={({ isActive }) => ({
          ...linkStyle,
          color: isActive ? 'var(--tg-text)' : linkStyle.color,
          background: isActive ? 'rgba(109, 211, 255, 0.12)' : 'transparent',
        })}
      >
        <span role="img" aria-label="dict">
          📚
        </span>
        Словарь
      </NavLink>
      <NavLink
        to="/profile"
        style={({ isActive }) => ({
          ...linkStyle,
          color: isActive ? 'var(--tg-text)' : linkStyle.color,
          background: isActive ? 'rgba(109, 211, 255, 0.12)' : 'transparent',
        })}
      >
        <span role="img" aria-label="profile">
          👤
        </span>
        Профиль
      </NavLink>
      <NavLink
        to="/admin"
        style={({ isActive }) => ({
          ...linkStyle,
          color: isActive ? 'var(--tg-text)' : linkStyle.color,
          background: isActive ? 'rgba(255, 200, 87, 0.12)' : 'transparent',
        })}
      >
        <span role="img" aria-label="admin">
          🛠
        </span>
        Админ
      </NavLink>
    </nav>
  );
}
