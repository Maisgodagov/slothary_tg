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

export default function LessonStepCardFillGapDemoPage() {
  const [count, setCount] = useState(0);

  return (
    <PageShell>
      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <div style={{ fontWeight: 700 }}>Карточка шага — демо (fill gap)</div>
        <LessonStepCard
          variant="fillGap"
          title="Заполни пропуски"
          text="Прослушай фразу и вставь слова."
          snippets={SAMPLE_SNIPPETS}
          gapSentenceParts={["Can I get a", "with no", "to go, please", ""]}
          gapCorrectWords={["large", "sugar"]}
          gapOptions={["large", "sugar", "table", "later", "apple", "small"]}
          onNext={() => setCount((prev) => prev + 1)}
        />
        <div style={{ color: "var(--tg-subtle)" }}>Нажато Далее: {count}</div>
      </div>
    </PageShell>
  );
}
