import { useState } from "react";

import { LessonStepCard } from "../shared/ui/LessonStepCard";
import { PageShell } from "../shared/ui/PageShell";

const SAMPLE_SNIPPETS = [
  {
    videoUrl: "https://cdn.pixabay.com/video/2023/04/06/157729-815177979_tiny.mp4",
    startSeconds: 0,
    endSeconds: 4,
    description: "Контекст 1: короткий отрывок.",
  },
  {
    videoUrl: "https://cdn.pixabay.com/video/2023/03/27/156283-812380154_tiny.mp4",
    startSeconds: 0,
    endSeconds: 4,
    description: "Контекст 2: другой отрывок.",
  },
];

export default function LessonStepCardDemoPage() {
  const [count, setCount] = useState(0);

  return (
    <PageShell>
      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <div style={{ fontWeight: 700 }}>Карточка шага — демо</div>
        <LessonStepCard
          title="Просто послушай"
          text="Подсказка/вопрос для ученика."
          snippets={SAMPLE_SNIPPETS}
          onNext={() => setCount((prev) => prev + 1)}
        />
        <div style={{ color: "var(--tg-subtle)" }}>Нажато Далее: {count}</div>
      </div>
    </PageShell>
  );
}
