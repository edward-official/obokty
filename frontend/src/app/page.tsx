import Link from 'next/link';

const features = [
  { icon: '🎯', title: 'Real-time Match', desc: 'Couples see the same word at the same time and choose the answer in their partner\'s language.' },
  { icon: '💬', title: 'Language Exchange', desc: 'Korean ↔ Polish. Naturally learn your partner\'s language.' },
  { icon: '🏆', title: 'Couple Records', desc: 'Compete with round-by-round results and accumulated win/loss records.' },
];

export default function LandingPage() {
  return (
    <main className="page">
      {/* Nav */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <span className="font-outfit fw-700" style={{ fontSize: '1.4rem', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ObokTy
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/auth/login"><button className="btn btn-ghost btn-sm">Log in</button></Link>
          <Link href="/auth/register"><button className="btn btn-primary btn-sm">Get Started</button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="center col" style={{ flex: 1, padding: '80px 24px', textAlign: 'center', gap: 24 }}>
        <div className="badge badge-primary anim-fade-up" style={{ marginBottom: 8 }}>
          ✨ Language Game for International Couples
        </div>
        <h1 className="anim-fade-up" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 800, lineHeight: 1.1, animationDelay: '0.1s', opacity: 0 }}>
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5, #4338ca)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Zawsze Obok Ty
          </span>
          <br />
          <span style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', fontWeight: 400, color: 'var(--text-muted)' }}>
            Always by your side
          </span>
        </h1>
        <p className="anim-fade-up" style={{ maxWidth: 520, color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1.05rem', animationDelay: '0.2s', opacity: 0 }}>
          A real-time quiz game where distant couples learn each other's language together.
          Look at the same word and compete in your respective languages.
        </p>
        <div className="row gap anim-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <Link href="/auth/register">
            <button className="btn btn-primary btn-lg">Start for Free →</button>
          </Link>
          <Link href="/auth/login">
            <button className="btn btn-secondary btn-lg">Log in</button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '40px 40px 80px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <div className="glow-line" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} className="card card-hover anim-fade-up stagger" style={{ padding: 28, animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 14 }}>{f.icon}</div>
              <h3 className="font-outfit fw-600" style={{ marginBottom: 8, fontSize: '1.1rem' }}>{f.title}</h3>
              <p className="text-muted text-sm" style={{ lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
