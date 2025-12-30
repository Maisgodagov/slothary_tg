import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, ...rest }: InputProps) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      {label && (
        <div style={{ marginBottom: 6, color: 'var(--tg-subtle)', fontSize: 13, fontWeight: 600 }}>
          {label}
        </div>
      )}
      <input
        style={{
          width: '100%',
          borderRadius: 12,
          border: `1px solid var(--tg-border)`,
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--tg-text)',
          padding: '12px 14px',
          fontSize: 14,
          outline: 'none',
        }}
        {...rest}
      />
      {hint && <div style={{ marginTop: 4, color: 'var(--tg-subtle)', fontSize: 12 }}>{hint}</div>}
    </label>
  );
}
