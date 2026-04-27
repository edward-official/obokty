'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getToken, getMe, WS_URL } from '@/lib/api';
import GameCard from '@/components/GameCard';
import QuizTimer from '@/components/QuizTimer';
import ResultOverlay from '@/components/ResultOverlay';
import ScoreBoard from '@/components/ScoreBoard';

type Phase =
  | 'connecting'
  | 'waiting_partner'
  | 'ready_sent'
  | 'game_start'
  | 'playing'
  | 'submitted'
  | 'round_result'
  | 'game_over';

interface RoundData  { round: number; word: string; choices: string[]; }
interface RoundResult { round: number; yourCorrect: boolean; partnerCorrect: boolean; correctAnswer: string; yourAnswer: string | null; }
interface GameOver   { winnerId: string | null; yourScore: number; partnerScore: number; }

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);

  const [myId, setMyId] = useState('');
  const [phase, setPhase] = useState<Phase>('connecting');
  const [config, setConfig]   = useState({ total_rounds: 0, time_limit_sec: 0 });
  const [round, setRound]     = useState<RoundData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult]   = useState<RoundResult | null>(null);
  const [gameOver, setGameOver] = useState<GameOver | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const startTimer = useCallback((sec: number) => {
    clearTimer();
    setTimeLeft(sec);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearTimer(); return 0; } return prev - 1; });
    }, 1000);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/auth/login'); return; }

    getMe(token).then(u => setMyId(u.id));

    const ws = new WebSocket(`${WS_URL}/ws/game/${sessionId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setPhase('waiting_partner');

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case 'connected':
          // send ready immediately after connect confirmation
          ws.send(JSON.stringify({ type: 'ready' }));
          setPhase('ready_sent');
          break;
        case 'game_start':
          setConfig({ total_rounds: msg.total_rounds, time_limit_sec: msg.time_limit_sec });
          setPhase('game_start');
          break;
        case 'round_start':
          setRound({ round: msg.round, word: msg.word, choices: msg.choices });
          setSelected(null);
          setPhase('playing');
          startTimer(msg.time_limit_sec ?? config.time_limit_sec);
          break;
        case 'round_result':
          clearTimer();
          setResult({ round: msg.round, yourCorrect: msg.your_correct, partnerCorrect: msg.partner_correct, correctAnswer: msg.correct_answer, yourAnswer: msg.your_answer });
          setPhase('round_result');
          break;
        case 'game_over':
          setGameOver({ winnerId: msg.winner_id, yourScore: msg.your_score, partnerScore: msg.partner_score });
          setPhase('game_over');
          break;
        case 'partner_disconnected':
          setPhase('connecting');
          break;
      }
    };

    ws.onerror = () => setPhase('connecting');
    ws.onclose = () => { if (phase !== 'game_over') setPhase('connecting'); };

    return () => { clearTimer(); ws.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const submitAnswer = (choice: string) => {
    if (!round || !wsRef.current || phase !== 'playing') return;
    setSelected(choice);
    setPhase('submitted');
    clearTimer();
    wsRef.current.send(JSON.stringify({ type: 'submit', round: round.round, answer: choice }));
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <main className="page center" style={{ padding: 24, minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Header */}
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
          <span className="font-outfit fw-700" style={{ fontSize: '1.2rem', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ObokTy</span>
          {phase === 'playing' && round && (
            <span className="badge badge-primary">Round {round.round} / {config.total_rounds}</span>
          )}
        </div>

        {/* Phases */}
        {(phase === 'connecting' || phase === 'waiting_partner' || phase === 'ready_sent' || phase === 'game_start') && (
          <div className="card center col gap-lg anim-fade-up" style={{ padding: 48, textAlign: 'center' }}>
            <div className="anim-spin" style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
            <div>
              <p className="font-outfit fw-600" style={{ fontSize: '1.2rem', marginBottom: 6 }}>
                {phase === 'connecting' ? '연결 중...' : phase === 'game_start' ? '게임 시작!' : '파트너 대기 중...'}
              </p>
              <p className="text-muted text-sm">
                {phase === 'connecting' ? 'WebSocket 연결 중입니다.' : phase === 'game_start' ? '곧 첫 번째 라운드가 시작됩니다.' : '상대방이 준비를 완료하면 게임이 시작됩니다.'}
              </p>
            </div>
          </div>
        )}

        {phase === 'playing' && round && (
          <div className="col gap-lg anim-fade-up">
            <QuizTimer total={config.time_limit_sec} left={timeLeft} />
            <GameCard word={round.word} choices={round.choices} selected={selected} submitted={false} onSelect={submitAnswer} />
          </div>
        )}

        {phase === 'submitted' && (
          <div className="card center col gap" style={{ padding: 40, textAlign: 'center' }}>
            <div className="anim-pulse" style={{ fontSize: '2rem' }}>⏳</div>
            <p className="font-outfit fw-600" style={{ fontSize: '1.1rem' }}>파트너 응답 대기 중...</p>
            {selected && <p className="text-muted text-sm">내 답: <strong style={{ color: 'var(--primary)' }}>{selected}</strong></p>}
          </div>
        )}

        {phase === 'round_result' && result && (
          <div className="card" style={{ padding: 28 }}>
            <ResultOverlay
              round={result.round}
              yourCorrect={result.yourCorrect}
              partnerCorrect={result.partnerCorrect}
              correctAnswer={result.correctAnswer}
              yourAnswer={result.yourAnswer}
            />
          </div>
        )}

        {phase === 'game_over' && gameOver && (
          <div className="card" style={{ padding: 32 }}>
            <ScoreBoard
              winnerId={gameOver.winnerId}
              myId={myId}
              yourScore={gameOver.yourScore}
              partnerScore={gameOver.partnerScore}
            />
          </div>
        )}
      </div>
    </main>
  );
}
