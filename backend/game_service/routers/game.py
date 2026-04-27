from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from schemas.game import SessionCreate, SessionResponse, HistoryItem
from core.database import get_connection
from core.auth import get_user_from_token
from typing import List

router = APIRouter(prefix="/game", tags=["game"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _current_user(token: str = Depends(oauth2_scheme)) -> dict:
    return get_user_from_token(token)


@router.post("/sessions", response_model=SessionResponse, status_code=201)
def create_session(body: SessionCreate, current_user: dict = Depends(_current_user)):
    """게임 세션 생성 - 로비에서 n, t 설정 후 호출"""
    if not current_user["partner_id"]:
        raise HTTPException(status_code=400, detail="You must be connected with a partner to start a game.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO game_sessions (couple_id, total_rounds, time_limit_sec)
                VALUES (%s, %s, %s)
                RETURNING id, total_rounds, time_limit_sec, status
                """,
                (current_user["id"], body.total_rounds, body.time_limit_sec),
            )
            row = cur.fetchone()
            conn.commit()
            return {
                "session_id": str(row[0]),
                "total_rounds": row[1],
                "time_limit_sec": row[2],
                "status": row[3],
            }
    finally:
        conn.close()


@router.get("/sessions/history", response_model=List[HistoryItem])
def get_history(current_user: dict = Depends(_current_user)):
    """커플 게임 전적 조회"""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, total_rounds, time_limit_sec, winner_id, started_at, finished_at
                FROM game_sessions
                WHERE couple_id = %s OR couple_id = %s
                ORDER BY created_at DESC
                LIMIT 20
                """,
                (current_user["id"], current_user.get("partner_id") or current_user["id"]),
            )
            rows = cur.fetchall()
            return [
                {
                    "session_id": str(r[0]),
                    "total_rounds": r[1],
                    "time_limit_sec": r[2],
                    "winner_id": str(r[3]) if r[3] else None,
                    "started_at": r[4],
                    "finished_at": r[5],
                }
                for r in rows
            ]
    finally:
        conn.close()
