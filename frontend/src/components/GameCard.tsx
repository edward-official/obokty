'use client';

interface Props {
  word: string;
  choices: string[];
  selected: string | null;
  submitted: boolean;
  onSelect: (choice: string) => void;
}

export default function GameCard({ word, choices, selected, submitted, onSelect }: Props) {
  return (
    <div className="col gap-lg" style={{ width: '100%' }}>
      {/* English word */}
      <div className="card center" style={{ padding: '32px 24px', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.10))', border: '1px solid rgba(124,58,237,0.3)' }}>
        <p className="text-xs text-muted" style={{ marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>영어 단어</p>
        <h2 className="font-outfit fw-800" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {word}
        </h2>
      </div>

      {/* Choices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {choices.map((choice, i) => {
          const isSelected = selected === choice;
          return (
            <button
              key={i}
              id={`choice-${i}`}
              className="card"
              onClick={() => !submitted && onSelect(choice)}
              style={{
                padding: '18px 16px',
                cursor: submitted ? 'default' : 'pointer',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: isSelected ? 'rgba(124,58,237,0.2)' : 'var(--glass)',
                boxShadow: isSelected ? 'var(--primary-glow)' : 'none',
                transition: 'all 0.2s',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                textAlign: 'center',
                fontSize: '1rem',
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? '#fff' : 'var(--text)',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', display: 'block', marginBottom: 4 }}>{String.fromCharCode(65 + i)}</span>
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
