import { useState } from "react";

import { LessonStepCard } from "../shared/ui/LessonStepCard";
import { PageShell } from "../shared/ui/PageShell";

const SAMPLE_SNIPPETS = [
  {
    videoUrl: "https://cdn.pixabay.com/video/2023/04/06/157729-815177979_tiny.mp4",
    startSeconds: 0,
    endSeconds: 4,
    description: "Контекст: короткий отрывок.",
  },
];

export default function LessonStepCardAssembleDemoPage() {
  const [count, setCount] = useState(0);

  return (
    <PageShell>
      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <div style={{ fontWeight: 700 }}>Карточка шага — демо (assemble)</div>
        <LessonStepCard
          variant="assemble"
          title="Собери фразу"
          text="Собери фразу по словам."
          snippets={SAMPLE_SNIPPETS}
          assembleWords={["Can", "I", "get", "a", "large", "coffee", "please"]}
          onNext={() => setCount((prev) => prev + 1)}
        />
        <div style={{ color: "var(--tg-subtle)" }}>Нажато Далее: {count}</div>
      </div>
    </PageShell>
  );
}
