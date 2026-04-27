const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_API_URL ?? 'http://localhost:8001';
const GAME_URL = process.env.NEXT_PUBLIC_GAME_API_URL ?? 'http://localhost:8002';
export const WS_URL  = process.env.NEXT_PUBLIC_GAME_WS_URL  ?? 'ws://localhost:8002';

// ── Token management ──────────────────────────────────────
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('obokty_token');
};

export const setToken = (token: string) => {
  localStorage.setItem('obokty_token', token);
  document.cookie = `obokty_token=${token}; path=/; max-age=86400; SameSite=Lax; Secure`;
};

export const removeToken = () => {
  localStorage.removeItem('obokty_token');
  document.cookie = 'obokty_token=; path=/; max-age=0';
};

// ── Auth API ──────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  native_language: 'ko' | 'pl';
  partner_id: string | null;
}

export async function register(email: string, password: string, native_language: 'ko' | 'pl'): Promise<User> {
  const res = await fetch(`${AUTH_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, native_language }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? '회원가입 실패');
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${AUTH_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? '로그인 실패');
  }
  const data = await res.json();
  return data.access_token;
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${AUTH_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('인증 실패');
  return res.json();
}

export async function sendCoupleRequest(token: string, receiver_email: string) {
  const res = await fetch(`${AUTH_URL}/couple/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ receiver_email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? '요청 실패');
  }
  return res.json();
}

export async function getCoupleRequests(token: string) {
  const res = await fetch(`${AUTH_URL}/couple/requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? '커플 요청 조회 실패');
  }
  return res.json();
}

export async function acceptCoupleRequest(token: string, requestId: number) {
  const res = await fetch(`${AUTH_URL}/couple/accept/${requestId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? '수락 실패');
  }
  return res.json();
}

// ── Game API ──────────────────────────────────────────────
export async function createSession(token: string, total_rounds: number, time_limit_sec: number) {
  const res = await fetch(`${GAME_URL}/game/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ total_rounds, time_limit_sec }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? '세션 생성 실패');
  }
  return res.json();
}

export async function getHistory(token: string) {
  const res = await fetch(`${GAME_URL}/game/sessions/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? '전적 조회 실패');
  }
  return res.json();
}
