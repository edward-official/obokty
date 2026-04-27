interface Props { total: number; left: number; }

export default function QuizTimer({ total, left }: Props) {
  const pct = total > 0 ? (left / total) * 100 : 0;
  const color = pct > 50 ? 'var(--success)' : pct > 25 ? 'var(--warning)' : 'var(--accent)';

  return (
    <div style={{ width: '100%' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="text-xs text-muted">남은 시간</span>
        <span className="fw-600" style={{ fontSize: '1.1rem', color, transition: 'color 0.5s' }}>{left}s</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          width: `${pct}%`,
          transition: 'width 1s linear, background 0.5s',
          boxShadow: `0 0 8px ${color}`,
        }} />
      </div>
    </div>
  );
}
