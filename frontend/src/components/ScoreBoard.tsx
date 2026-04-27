'use client';
import { useRouter } from 'next/navigation';

interface Props {
  winnerId: string | null;
  myId: string;
  yourScore: number;
  partnerScore: number;
}

export default function ScoreBoard({ winnerId, myId, yourScore, partnerScore }: Props) {
  const router = useRouter();
  const isDraw = winnerId === null;
  const iWon = winnerId === myId;

  return (
    <div className="center col gap-lg anim-pop" style={{ width: '100%', textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '4rem' }}>{isDraw ? '🤝' : iWon ? '🏆' : '💙'}</div>
      <div>
        <p className="text-xs text-muted" style={{ marginBottom: 8, letterSpacing: '0.1em' }}>게임 종료</p>
        <h2 className="font-outfit fw-800" style={{ fontSize: '2rem', color: isDraw ? 'var(--secondary)' : iWon ? 'var(--success)' : 'var(--accent)' }}>
          {isDraw ? '동점!' : iWon ? '승리!' : '패배'}
        </h2>
        {!iWon && !isDraw && <p className="text-muted text-sm" style={{ marginTop: 6 }}>다음에 더 잘할 수 있어요 💪</p>}
      </div>

      {/* Score comparison */}
      <div className="card row" style={{ padding: '24px 32px', gap: 32, justifyContent: 'center' }}>
        <div className="col" style={{ alignItems: 'center', gap: 4 }}>
          <span className="text-xs text-muted">나</span>
          <span className="font-outfit fw-800" style={{ fontSize: '2.5rem', color: yourScore > partnerScore ? 'var(--success)' : 'var(--text)' }}>{yourScore}</span>
        </div>
        <div style={{ color: 'var(--text-faint)', fontSize: '1.5rem', alignSelf: 'center' }}>:</div>
        <div className="col" style={{ alignItems: 'center', gap: 4 }}>
          <span className="text-xs text-muted">파트너</span>
          <span className="font-outfit fw-800" style={{ fontSize: '2.5rem', color: partnerScore > yourScore ? 'var(--success)' : 'var(--text)' }}>{partnerScore}</span>
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={() => router.push('/game/lobby')}>
        로비로 돌아가기
      </button>
    </div>
  );
}
