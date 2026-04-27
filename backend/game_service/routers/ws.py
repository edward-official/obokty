from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError
from core.auth import get_user_from_token
from core.database import get_connection
from core import session_manager as sm
import json

router = APIRouter(tags=["websocket"])


def _load_session_config(conn, session_id: str) -> dict | None:
    """DB에서 세션 설정 조회"""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT total_rounds, time_limit_sec, status FROM game_sessions WHERE id = %s",
            (session_id,),
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"total_rounds": row[0], "time_limit_sec": row[1], "status": row[2]}


def _load_words(conn, n: int) -> tuple[list, list]:
    """DB에서 랜덤 n개 단어 + 전체 단어 조회"""
    with conn.cursor() as cur:
        # 게임용 랜덤 n개
        cur.execute(
            "SELECT id, base_word, translation_pl, translation_kr FROM words ORDER BY RANDOM() LIMIT %s",
            (n,),
        )
        game_words = [
            {"id": r[0], "base_word": r[1], "translation_pl": r[2], "translation_kr": r[3]}
            for r in cur.fetchall()
        ]
        # 오답 생성용 전체 단어
        cur.execute("SELECT id, base_word, translation_pl, translation_kr FROM words")
        all_words = [
            {"id": r[0], "base_word": r[1], "translation_pl": r[2], "translation_kr": r[3]}
            for r in cur.fetchall()
        ]
    return game_words, all_words


@router.websocket("/ws/game/{session_id}")
async def game_ws(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...),
):
    # ── 1. JWT 인증 ──────────────────────────────────────────
    try:
        user = get_user_from_token(token)
    except Exception:
        await websocket.close(code=4001)
        return

    user_id = user["id"]

    # ── 2. DB에서 세션 설정 로드 ─────────────────────────────
    conn = get_connection()
    config = _load_session_config(conn, session_id)
    if not config or config["status"] == "finished":
        await websocket.close(code=4004)
        conn.close()
        return

    # ── 3. WebSocket 수락 + 세션에 연결 등록 ─────────────────
    await websocket.accept()

    # 세션이 메모리에 없으면 초기화
    if sm.get_session(session_id) is None:
        sm.init_session(session_id, config)

    sm.add_connection(session_id, user_id, websocket, {"native_language": user["native_language"]})
    await websocket.send_json({"type": "connected", "user_id": user_id})

    # ── 4. 메시지 루프 ────────────────────────────────────────
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")
            session = sm.get_session(session_id)
            if not session:
                break

            # ── ready ──────────────────────────────────────
            if msg_type == "ready":
                session["ready"].add(user_id)

                # 두 플레이어 모두 ready → 게임 시작
                if len(session["ready"]) == 2 and session["current_round"] == 0:
                    # 단어 로드
                    game_words, all_words = _load_words(conn, config["total_rounds"])
                    session["words"] = game_words
                    session["all_words"] = all_words

                    # DB 상태 → playing
                    with conn.cursor() as cur:
                        cur.execute(
                            "UPDATE game_sessions SET status='playing', started_at=NOW() WHERE id=%s",
                            (session_id,),
                        )
                    conn.commit()

                    await sm.broadcast(session_id, {
                        "type": "game_start",
                        "total_rounds": config["total_rounds"],
                        "time_limit_sec": config["time_limit_sec"],
                    })
                    await sm.start_round(session_id, 1, conn)

            # ── submit ─────────────────────────────────────
            elif msg_type == "submit":
                round_num = msg.get("round")
                answer = msg.get("answer", "")
                if isinstance(round_num, int) and isinstance(answer, str):
                    await sm.handle_submit(session_id, user_id, round_num, answer, conn)

    except WebSocketDisconnect:
        sm.remove_connection(session_id, user_id)
        # 상대방에게 연결 끊김 알림
        await sm.broadcast(session_id, {"type": "partner_disconnected"})

    finally:
        conn.close()
