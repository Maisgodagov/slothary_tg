export default function DictionaryPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 16px",
        color: "var(--tg-text, #e9edf7)",
        background: "var(--tg-background, #0b1020)",
        display: "grid",
        gap: "12px",
        alignContent: "center",
        justifyItems: "center",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 28, margin: 0, fontWeight: 800 }}>Coming soon</h1>
      <p
        style={{
          margin: 0,
          fontSize: 16,
          color: "var(--tg-subtle, #cfd5e4)",
          maxWidth: 520,
        }}
      >
        Раздел словаря находится в разработке. Мы добавим его в ближайшее время.
      </p>
    </div>
  );
}
