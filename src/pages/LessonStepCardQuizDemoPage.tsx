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

const SAMPLE_ANSWERS = [
  { id: "a", text: "Просто послушай", isCorrect: false },
  { id: "b", text: "Это значит: да", isCorrect: true },
  { id: "c", text: "Собери фразу", isCorrect: false },
];

export default function LessonStepCardQuizDemoPage() {
  const [count, setCount] = useState(0);

  return (
    <PageShell>
      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <div style={{ fontWeight: 700 }}>Карточка шага — демо (квиз)</div>
        <LessonStepCard
          variant="quiz"
          title="Как это переводится?"
          text="Выбери правильный вариант ответа."
          snippets={SAMPLE_SNIPPETS}
          answers={SAMPLE_ANSWERS}
          onNext={() => setCount((prev) => prev + 1)}
        />
        <div style={{ color: "var(--tg-subtle)" }}>Нажато Далее: {count}</div>
      </div>
    </PageShell>
  );
}
