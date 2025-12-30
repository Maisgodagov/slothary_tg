export function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '4px solid rgba(109, 211, 255, 0.3)',
          borderTopColor: 'var(--tg-accent-strong)',
          animation: 'spin 0.9s linear infinite',
        }}
      />
      <style>
        {`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}
      </style>
    </div>
  );
}
