'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, login, setToken } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lang, setLang] = useState<'ko' | 'pl'>('ko');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(email, password, lang);
      const token = await login(email, password);
      setToken(token);
      router.push('/game/lobby');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '회원가입 실패');
    } finally { setLoading(false); }
  };

  return (
    <main className="page center" style={{ padding: 24 }}>
      <div className="card anim-pop" style={{ width: '100%', maxWidth: 420, padding: '40px 36px' }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <div className="font-outfit fw-700" style={{ fontSize: '1.8rem', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>ObokTy</div>
          <p className="text-muted text-sm">새 계정을 만드세요</p>
        </div>

        <form onSubmit={handleSubmit} className="col gap-lg">
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input id="reg-email" className="input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input id="reg-password" className="input" type="password" placeholder="8자 이상" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">모국어</label>
            <select id="reg-lang" className="select" value={lang} onChange={e => setLang(e.target.value as 'ko' | 'pl')}>
              <option value="ko">🇰🇷 한국어</option>
              <option value="pl">🇵🇱 Polski</option>
            </select>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button id="reg-submit" className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="anim-spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #fff3', borderTopColor: '#fff', borderRadius: '50%' }} /> : '계정 만들기'}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0' }} />
        <p className="text-center text-sm text-muted">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-primary fw-600">로그인</Link>
        </p>
      </div>
    </main>
  );
}
