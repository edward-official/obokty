'use client';

interface Props {
  round: number;
  yourCorrect: boolean;
  partnerCorrect: boolean;
  correctAnswer: string;
  yourAnswer: string | null;
}

export default function ResultOverlay({ round, yourCorrect, partnerCorrect, correctAnswer, yourAnswer }: Props) {
  return (
    <div className="center col gap-lg anim-pop" style={{ width: '100%', padding: '20px 0' }}>
      {/* Round result header */}
      <div style={{ textAlign: 'center' }}>
        <p className="text-xs text-muted" style={{ marginBottom: 8, letterSpacing: '0.1em' }}>ROUND {round} RESULT</p>
        <div style={{ fontSize: '3rem' }}>{yourCorrect ? '✅' : '❌'}</div>
        <p className="font-outfit fw-700" style={{ fontSize: '1.4rem', marginTop: 8, color: yourCorrect ? 'var(--success)' : 'var(--accent)' }}>
          {yourCorrect ? 'Correct!' : 'Incorrect'}
        </p>
      </div>

      {/* Correct answer */}
      <div className="card" style={{ padding: '16px 28px', textAlign: 'center', borderColor: 'rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.1)' }}>
        <p className="text-xs text-muted" style={{ marginBottom: 4 }}>Correct Answer</p>
        <p className="font-outfit fw-700" style={{ fontSize: '1.5rem' }}>{correctAnswer}</p>
        {yourAnswer && !yourCorrect && <p className="text-xs text-muted" style={{ marginTop: 4 }}>My Answer: {yourAnswer}</p>}
      </div>

      {/* Partner result */}
      <div className="card row" style={{ padding: '14px 24px', gap: 12, justifyContent: 'center' }}>
        <span className="text-sm text-muted">Partner</span>
        <span style={{ fontSize: '1.3rem' }}>{partnerCorrect ? '✅' : '❌'}</span>
        <span className="text-sm fw-600" style={{ color: partnerCorrect ? 'var(--success)' : 'var(--accent)' }}>
          {partnerCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>

      <p className="text-xs text-muted anim-pulse">Preparing next round...</p>
    </div>
  );
}
