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
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <main className="page center" style={{ padding: 24 }}>
      <div className="card anim-pop" style={{ width: '100%', maxWidth: 420, padding: '40px 36px' }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <div className="font-outfit fw-700" style={{ fontSize: '1.8rem', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>ObokTy</div>
          <p className="text-muted text-sm">Create a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="col gap-lg">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="reg-email" className="input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" className="input" type="password" placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div className="form-group">
            <label className="form-label">Native Language</label>
            <select id="reg-lang" className="select" value={lang} onChange={e => setLang(e.target.value as 'ko' | 'pl')}>
              <option value="ko">🇰🇷 Korean</option>
              <option value="pl">🇵🇱 Polski</option>
            </select>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button id="reg-submit" className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="anim-spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #fff3', borderTopColor: '#fff', borderRadius: '50%' }} /> : 'Create Account'}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0' }} />
        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary fw-600">Log in</Link>
        </p>
      </div>
    </main>
  );
}
