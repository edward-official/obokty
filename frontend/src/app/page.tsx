import Link from 'next/link';

const features = [
  { icon: '🎯', title: '실시간 대전', desc: '커플이 동시에 같은 단어를 보고 서로의 언어로 정답을 선택합니다.' },
  { icon: '💬', title: '언어 교환', desc: '한국어 ↔ 폴란드어. 상대방의 언어를 자연스럽게 배워가세요.' },
  { icon: '🏆', title: '커플 전적', desc: '라운드별 정답 여부와 누적 승/패 기록으로 경쟁하세요.' },
];

export default function LandingPage() {
  return (
    <main className="page">
      {/* Nav */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <span className="font-outfit fw-700" style={{ fontSize: '1.4rem', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ObokTy
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/auth/login"><button className="btn btn-ghost btn-sm">로그인</button></Link>
          <Link href="/auth/register"><button className="btn btn-primary btn-sm">시작하기</button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="center col" style={{ flex: 1, padding: '80px 24px', textAlign: 'center', gap: 24 }}>
        <div className="badge badge-primary anim-fade-up" style={{ marginBottom: 8 }}>
          ✨ 국제 커플을 위한 언어 게임
        </div>
        <h1 className="anim-fade-up" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 800, lineHeight: 1.1, animationDelay: '0.1s', opacity: 0 }}>
          <span style={{ background: 'linear-gradient(135deg, #c4b5fd, #a78bfa, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Zawsze Obok Ty
          </span>
          <br />
          <span style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', fontWeight: 400, color: 'var(--text-muted)' }}>
            항상 네 곁에
          </span>
        </h1>
        <p className="anim-fade-up" style={{ maxWidth: 520, color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1.05rem', animationDelay: '0.2s', opacity: 0 }}>
          멀리 떨어진 커플이 함께 서로의 언어를 배우는 실시간 퀴즈 게임.
          같은 단어를 보고, 각자의 언어로 경쟁하세요.
        </p>
        <div className="row gap anim-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <Link href="/auth/register">
            <button className="btn btn-primary btn-lg">무료로 시작하기 →</button>
          </Link>
          <Link href="/auth/login">
            <button className="btn btn-secondary btn-lg">로그인</button>
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
