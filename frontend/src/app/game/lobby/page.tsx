"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getToken,
  removeToken,
  getMe,
  createSession,
  getHistory,
  sendCoupleRequest,
  getCoupleRequests,
  acceptCoupleRequest,
  type User,
} from "@/lib/api";

interface HistoryItem {
  session_id: string;
  total_rounds: number;
  winner_id: string | null;
  status: string;
  started_at: string | null;
}
interface CoupleRequest {
  id: number;
  sender_email: string;
  status: string;
}

export default function LobbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rounds, setRounds] = useState(5);
  const [timeSec, setTimeSec] = useState(15);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [requests, setRequests] = useState<CoupleRequest[]>([]);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const notify = (text: string, error = false) => {
    setMsg(text);
    setIsError(error);
  };
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(
    async (token: string) => {
      try {
        const [me, hist, reqs] = await Promise.all([
          getMe(token),
          getHistory(token),
          getCoupleRequests(token),
        ]);
        setUser(me);
        setHistory(hist);
        setRequests(reqs);
      } catch {
        removeToken();
        router.push("/auth/login");
      }
    },
    [router],
  );

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }
    const validToken: string = token;
    async function init() {
      await loadData(validToken);
    }
    init();

    const interval = setInterval(() => loadData(validToken), 5000);
    return () => clearInterval(interval);
  }, [loadData, router]);

  const handleStart = async () => {
    const token = getToken();
    if (!token || !user?.partner_id) return;
    setLoading(true);
    try {
      const session = await createSession(token, rounds, timeSec);
      router.push(`/game/${session.session_id}`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Error occurred", true);
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    const token = getToken();
    if (!token || !partnerEmail) return;
    try {
      await sendCoupleRequest(token, partnerEmail);
      notify("Request sent! Wait for your partner to accept.", false);
      setPartnerEmail("");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Error", true);
    }
  };

  const handleAccept = async (id: number) => {
    const token = getToken();
    if (!token) return;
    await acceptCoupleRequest(token, id);
    await loadData(token);
    notify("Couple connected! 🎉", false);
  };

  const logout = () => {
    removeToken();
    router.push("/");
  };

  if (!user)
    return (
      <main className="page center">
        <div
          className="anim-spin"
          style={{
            width: 40,
            height: 40,
            border: "3px solid var(--border)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
          }}
        />
      </main>
    );

  const hasPartner = !!user.partner_id;

  return (
    <main className="page" style={{ padding: "24px" }}>
      {/* Top bar */}
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          maxWidth: 800,
          margin: "0 auto 32px",
          width: "100%",
        }}
      >
        <span
          className="font-outfit fw-700"
          style={{
            fontSize: "1.4rem",
            background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ObokTy
        </span>
        <div className="row gap-sm">
          <span className="badge badge-primary">
            {user.native_language === "ko" ? "🇰🇷 Korean" : "🇵🇱 Polski"}
          </span>
          <span className="text-muted text-sm">{user.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          width: "100%",
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        }}
      >
        {/* Game Setup */}
        <div className="card col gap-lg anim-fade-up" style={{ padding: 28 }}>
          <h2 className="font-outfit fw-700" style={{ fontSize: "1.3rem" }}>
            🎮 Game Setup
          </h2>
          {hasPartner && (
            <div
              className="badge badge-success"
              style={{ width: "fit-content" }}
            >
              ✓ Couple Connected
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Total Rounds (n)</label>
            <div className="row gap-sm">
              {[3, 5, 10].map((n) => (
                <button
                  key={n}
                  className={`btn btn-sm ${rounds === n ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setRounds(n)}
                  style={{ flex: 1 }}
                  disabled={!hasPartner}
                >
                  {n} Rounds
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Time Limit (t sec)</label>
            <div className="row gap-sm">
              {[10, 15, 30].map((t) => (
                <button
                  key={t}
                  className={`btn btn-sm ${timeSec === t ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setTimeSec(t)}
                  style={{ flex: 1 }}
                  disabled={!hasPartner}
                >
                  {t} sec
                </button>
              ))}
            </div>
          </div>
          {msg && hasPartner && (
            <div
              className="error-msg"
              style={{ color: isError ? undefined : "var(--success)" }}
            >
              {msg}
            </div>
          )}
          <div style={{ position: "relative" }}>
            <button
              id="start-game"
              className="btn btn-primary btn-full btn-lg"
              onClick={handleStart}
              disabled={loading || !hasPartner}
              title={
                !hasPartner
                  ? "You can start the game after connecting with your partner"
                  : undefined
              }
            >
              {loading ? "Creating..." : "Start Game →"}
            </button>
            {!hasPartner && (
              <p
                className="text-xs text-muted"
                style={{ marginTop: 8, textAlign: "center" }}
              >
                💑 Connect with your partner on the right to start the game
              </p>
            )}
          </div>
        </div>

        {/* Couple Connect */}
        {!hasPartner && (
          <div
            className="card col gap-lg anim-fade-up"
            style={{ padding: 28, animationDelay: "0.1s" }}
          >
            <h2 className="font-outfit fw-700" style={{ fontSize: "1.3rem" }}>
              💑 Couple Connection
            </h2>
            <div className="form-group">
              <label className="form-label">Partner Email</label>
              <input
                className="input"
                type="email"
                placeholder="partner@email.com"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
              />
            </div>
            <button className="btn btn-accent btn-full" onClick={handleRequest}>
              Send Connection Request
            </button>
            {requests.length > 0 && (
              <>
                <div className="divider" />
                <p className="text-sm text-muted fw-600">Received Requests</p>
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="row"
                    style={{ justifyContent: "space-between" }}
                  >
                    <span className="text-sm">{r.sender_email}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAccept(r.id)}
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </>
            )}
            {msg && (
              <div
                className="error-msg"
                style={{ color: isError ? undefined : "var(--success)" }}
              >
                {msg}
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div
            className="card col gap anim-fade-up"
            style={{ padding: 28, animationDelay: "0.2s" }}
          >
            <h2 className="font-outfit fw-700" style={{ fontSize: "1.3rem" }}>
              📊 Game History
            </h2>
            {history.slice(0, 5).map((h) => (
              <div
                key={h.session_id}
                className="row"
                style={{
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span className="text-sm text-muted">
                  {h.started_at
                    ? new Date(h.started_at).toLocaleDateString()
                    : "-"}
                </span>
                <span className="text-sm">{h.total_rounds} Rounds</span>
                {h.status === "waiting" ? (
                  <button
                    className="btn btn-primary btn-sm anim-pulse"
                    onClick={() => router.push(`/game/${h.session_id}`)}
                  >
                    Join Game →
                  </button>
                ) : (
                  <span
                    className={`badge ${h.winner_id === user.id ? "badge-success" : h.winner_id ? "badge-accent" : "badge-primary"}`}
                  >
                    {h.winner_id === user.id
                      ? "Win"
                      : h.winner_id
                        ? "Loss"
                        : "Draw"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
