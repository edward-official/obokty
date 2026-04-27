# game_service/core/session_manager.py
# In-memory 게임 세션 상태 관리

import asyncio
from typing import Any
from fastapi import WebSocket

# { session_id: { "connections": {user_id: WebSocket}, "answers": {round: {user_id: answer}}, "timer": asyncio.Task } }
_sessions: dict[str, dict[str, Any]] = {}


def create_session(session_id: str) -> None:
    _sessions[session_id] = {
        "connections": {},
        "answers": {},
        "timer": None,
    }


def get_session(session_id: str) -> dict | None:
    return _sessions.get(session_id)


def add_connection(session_id: str, user_id: str, ws: WebSocket) -> None:
    if session_id not in _sessions:
        create_session(session_id)
    _sessions[session_id]["connections"][user_id] = ws


def remove_connection(session_id: str, user_id: str) -> None:
    session = _sessions.get(session_id)
    if session:
        session["connections"].pop(user_id, None)


async def broadcast(session_id: str, message: dict) -> None:
    """세션 내 모든 연결에 메시지 전송"""
    session = _sessions.get(session_id)
    if not session:
        return
    for ws in list(session["connections"].values()):
        try:
            await ws.send_json(message)
        except Exception:
            pass


def cleanup_session(session_id: str) -> None:
    _sessions.pop(session_id, None)
