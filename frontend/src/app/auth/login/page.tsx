'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const token = await login(email, password);
      setToken(token);
      router.push('/game/lobby');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <main className="page center" style={{ padding: 24 }}>
      <div className="card anim-pop" style={{ width: '100%', maxWidth: 420, padding: '40px 36px' }}>
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 32 }}>
          <div className="font-outfit fw-700" style={{ fontSize: '1.8rem', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>ObokTy</div>
          <p className="text-muted text-sm">Log in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="col gap-lg">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="login-email" className="input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button id="login-submit" className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="anim-spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #fff3', borderTopColor: '#fff', borderRadius: '50%' }} /> : 'Log in'}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0' }} />
        <p className="text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-primary fw-600">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
