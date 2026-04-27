'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, removeToken, getMe, createSession, getHistory, sendCoupleRequest, getCoupleRequests, acceptCoupleRequest, type User } from '@/lib/api';

interface HistoryItem { session_id: string; total_rounds: number; winner_id: string | null; started_at: string | null; }
interface CoupleRequest { id: number; sender_email: string; status: string; }

export default function LobbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rounds, setRounds] = useState(5);
  const [timeSec, setTimeSec] = useState(15);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [requests, setRequests] = useState<CoupleRequest[]>([]);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async (token: string) => {
    const [me, hist, reqs] = await Promise.all([getMe(token), getHistory(token), getCoupleRequests(token)]);
    setUser(me); setHistory(hist); setRequests(reqs);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/auth/login'); return; }
    loadData(token);
  }, [loadData, router]);

  const handleStart = async () => {
    const token = getToken();
    if (!token || !user?.partner_id) return;
    setLoading(true);
    try {
      const session = await createSession(token, rounds, timeSec);
      router.push(`/game/${session.session_id}`);
    } catch (e) { setMsg(e instanceof Error ? e.message : '오류 발생'); setLoading(false); }
  };

  const handleRequest = async () => {
    const token = getToken();
    if (!token || !partnerEmail) return;
    try { await sendCoupleRequest(token, partnerEmail); setMsg('요청을 보냈습니다! 상대방이 수락하길 기다리세요.'); setPartnerEmail(''); }
    catch (e) { setMsg(e instanceof Error ? e.message : '오류'); }
  };

  const handleAccept = async (id: number) => {
    const token = getToken();
    if (!token) return;
    await acceptCoupleRequest(token, id);
    await loadData(token);
    setMsg('커플 연결 완료! 🎉');
  };

  const logout = () => { removeToken(); router.push('/'); };

  if (!user) return <main className="page center"><div className="anim-spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} /></main>;

  const hasPartner = !!user.partner_id;

  return (
    <main className="page" style={{ padding: '24px' }}>
      {/* Top bar */}
      <div className="row" style={{ justifyContent: 'space-between', maxWidth: 800, margin: '0 auto 32px', width: '100%' }}>
        <span className="font-outfit fw-700" style={{ fontSize: '1.4rem', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ObokTy</span>
        <div className="row gap-sm">
          <span className="badge badge-primary">{user.native_language === 'ko' ? '🇰🇷 한국어' : '🇵🇱 Polski'}</span>
          <span className="text-muted text-sm">{user.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>로그아웃</button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>

        {/* Game Setup */}
        <div className="card col gap-lg anim-fade-up" style={{ padding: 28 }}>
          <h2 className="font-outfit fw-700" style={{ fontSize: '1.3rem' }}>🎮 게임 설정</h2>
          {!hasPartner ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p className="text-muted text-sm" style={{ marginBottom: 16 }}>커플 연결 후 게임을 시작할 수 있습니다.</p>
            </div>
          ) : (
            <>
              <div className="badge badge-success" style={{ width: 'fit-content' }}>✓ 커플 연결됨</div>
              <div className="form-group">
                <label className="form-label">총 문제 수 (n)</label>
                <div className="row gap-sm">
                  {[3, 5, 10].map(n => (
                    <button key={n} className={`btn btn-sm ${rounds === n ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRounds(n)} style={{ flex: 1 }}>{n}문제</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">제한 시간 (t초)</label>
                <div className="row gap-sm">
                  {[10, 15, 30].map(t => (
                    <button key={t} className={`btn btn-sm ${timeSec === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTimeSec(t)} style={{ flex: 1 }}>{t}초</button>
                  ))}
                </div>
              </div>
              {msg && <div className="error-msg" style={{ color: msg.includes('완료') || msg.includes('보냈') ? 'var(--success)' : undefined }}>{msg}</div>}
              <button id="start-game" className="btn btn-primary btn-full btn-lg" onClick={handleStart} disabled={loading}>
                {loading ? '생성 중...' : '게임 시작 →'}
              </button>
            </>
          )}
        </div>

        {/* Couple Connect */}
        {!hasPartner && (
          <div className="card col gap-lg anim-fade-up" style={{ padding: 28, animationDelay: '0.1s' }}>
            <h2 className="font-outfit fw-700" style={{ fontSize: '1.3rem' }}>💑 커플 연결</h2>
            <div className="form-group">
              <label className="form-label">파트너 이메일</label>
              <input className="input" type="email" placeholder="partner@email.com" value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)} />
            </div>
            <button className="btn btn-accent btn-full" onClick={handleRequest}>연결 요청 보내기</button>
            {requests.length > 0 && (
              <>
                <div className="divider" />
                <p className="text-sm text-muted fw-600">받은 요청</p>
                {requests.map(r => (
                  <div key={r.id} className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="text-sm">{r.sender_email}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => handleAccept(r.id)}>수락</button>
                  </div>
                ))}
              </>
            )}
            {msg && <div className="error-msg">{msg}</div>}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="card col gap anim-fade-up" style={{ padding: 28, animationDelay: '0.2s' }}>
            <h2 className="font-outfit fw-700" style={{ fontSize: '1.3rem' }}>📊 게임 전적</h2>
            {history.slice(0, 5).map(h => (
              <div key={h.session_id} className="row" style={{ justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm text-muted">{h.started_at ? new Date(h.started_at).toLocaleDateString('ko-KR') : '-'}</span>
                <span className="text-sm">{h.total_rounds}라운드</span>
                <span className={`badge ${h.winner_id === user.id ? 'badge-success' : h.winner_id ? 'badge-accent' : 'badge-primary'}`}>
                  {h.winner_id === user.id ? '승리' : h.winner_id ? '패배' : '동점'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
