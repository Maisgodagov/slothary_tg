type StageView = {
  key: string;
  label: string;
  total: number;
  completed: number;
  isCurrent: boolean;
  isDone: boolean;
};

type Props = {
  stages: StageView[];
};

export function TrainingStageStepper({ stages }: Props) {
  if (!stages.length) return null;
  const current = stages.find((stage) => stage.isCurrent) ?? stages[stages.length - 1];

  return (
    <div
      style={{
        display: 'grid',
        gap: 6,
        marginTop: 2,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          minHeight: 18,
        }}
      >
        {stages.map((stage, index) => (
          <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
            <div
              title={`${stage.label}: ${stage.completed}/${stage.total}`}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: stage.isCurrent
                  ? '2px solid rgba(46, 163, 255, 0.95)'
                  : stage.isDone
                  ? '2px solid rgba(67, 201, 127, 0.95)'
                  : '2px solid var(--tg-border)',
                background: stage.isDone
                  ? 'rgba(67, 201, 127, 0.95)'
                  : stage.isCurrent
                  ? 'rgba(46, 163, 255, 0.95)'
                  : 'transparent',
                boxShadow: stage.isCurrent ? '0 0 0 2px rgba(46, 163, 255, 0.2)' : 'none',
              }}
            />
            {index < stages.length - 1 ? (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  borderRadius: 999,
                  background:
                    stage.isDone || stage.isCurrent
                      ? 'rgba(67, 201, 127, 0.65)'
                      : 'var(--tg-border)',
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--tg-subtle)',
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {`${current.label}: ${current.completed}/${current.total}`}
      </div>
    </div>
  );
}

