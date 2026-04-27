import asyncio
import random
from typing import Any
from fastapi import WebSocket

# { session_id: GameSession dict }
_sessions: dict[str, dict[str, Any]] = {}


# ──────────────────────────────────────────────
# 세션 초기화 / 연결 관리
# ──────────────────────────────────────────────

def init_session(session_id: str, config: dict) -> None:
    _sessions[session_id] = {
        "connections": {},       # {user_id: WebSocket}
        "players": {},           # {user_id: {native_language}}
        "ready": set(),
        "config": config,        # {total_rounds, time_limit_sec}
        "words": [],             # [{id, base_word, translation_pl, translation_kr}]
        "all_words": [],         # 오답 생성용 전체 단어 목록
        "current_round": 0,
        "answers": {},           # {round_num: {user_id: str|None}}
        "scores": {},            # {user_id: int}
        "round_evaluated": set(),
        "timer_task": None,
    }


def get_session(session_id: str) -> dict | None:
    return _sessions.get(session_id)


def add_connection(session_id: str, user_id: str, ws: WebSocket, player_info: dict) -> None:
    s = _sessions.get(session_id)
    if s is None:
        return
    s["connections"][user_id] = ws
    s["players"][user_id] = player_info
    s["scores"].setdefault(user_id, 0)


def remove_connection(session_id: str, user_id: str) -> None:
    s = _sessions.get(session_id)
    if s:
        s["connections"].pop(user_id, None)
        s["ready"].discard(user_id)


def cleanup_session(session_id: str) -> None:
    _sessions.pop(session_id, None)


# ──────────────────────────────────────────────
# 브로드캐스트 헬퍼
# ──────────────────────────────────────────────

async def broadcast(session_id: str, message: dict) -> None:
    s = _sessions.get(session_id)
    if not s:
        return
    for ws in list(s["connections"].values()):
        try:
            await ws.send_json(message)
        except Exception:
            pass


async def send_to(session_id: str, user_id: str, message: dict) -> None:
    s = _sessions.get(session_id)
    if not s:
        return
    ws = s["connections"].get(user_id)
    if ws:
        try:
            await ws.send_json(message)
        except Exception:
            pass


# ──────────────────────────────────────────────
# 게임 로직
# ──────────────────────────────────────────────

def _make_choices(correct: str, pool: list[str]) -> list[str]:
    """정답 + 오답 3개 섞인 선택지 반환"""
    wrong = [t for t in pool if t != correct]
    choices = [correct] + random.sample(wrong, min(3, len(wrong)))
    random.shuffle(choices)
    return choices


async def start_round(session_id: str, round_number: int, conn) -> None:
    """라운드 시작: 개인화된 선택지 전송 + 타이머 시작"""
    s = _sessions.get(session_id)
    if not s:
        return

    s["current_round"] = round_number
    s["answers"][round_number] = {}

    word = s["words"][round_number - 1]
    all_pl = [w["translation_pl"] for w in s["all_words"]]
    all_kr = [w["translation_kr"] for w in s["all_words"]]

    for user_id, ws in list(s["connections"].items()):
        lang = s["players"][user_id]["native_language"]
        choices = _make_choices(
            word["translation_pl"] if lang == "ko" else word["translation_kr"],
            all_pl if lang == "ko" else all_kr,
        )
        try:
            await ws.send_json({
                "type": "round_start",
                "round": round_number,
                "word": word["base_word"],
                "choices": choices,
            })
        except Exception:
            pass

    t = s["config"]["time_limit_sec"]
    s["timer_task"] = asyncio.create_task(
        _round_timer(session_id, round_number, t, conn)
    )


async def _round_timer(session_id: str, round_number: int, duration: int, conn) -> None:
    try:
        await asyncio.sleep(duration)
        await evaluate_round(session_id, round_number, conn)
    except asyncio.CancelledError:
        pass


async def handle_submit(session_id: str, user_id: str, round_number: int, answer: str, conn) -> None:
    """정답 제출 처리 - 두 명 모두 제출 시 즉시 채점"""
    s = _sessions.get(session_id)
    if not s or round_number != s["current_round"]:
        return
    if user_id in s["answers"].get(round_number, {}):
        return  # 중복 제출 무시

    s["answers"][round_number][user_id] = answer

    if len(s["answers"][round_number]) >= len(s["connections"]):
        task = s.get("timer_task")
        if task and not task.done():
            task.cancel()
        await evaluate_round(session_id, round_number, conn)


async def evaluate_round(session_id: str, round_number: int, conn) -> None:
    """채점 → round_answers 저장 → round_result 전송"""
    s = _sessions.get(session_id)
    if not s or round_number in s["round_evaluated"]:
        return
    s["round_evaluated"].add(round_number)

    word = s["words"][round_number - 1]
    player_ids = list(s["connections"].keys())
    results = {}

    for uid in player_ids:
        lang = s["players"][uid]["native_language"]
        correct_ans = word["translation_pl"] if lang == "ko" else word["translation_kr"]
        given = s["answers"][round_number].get(uid)
        ok = bool(given) and given.strip().lower() == correct_ans.strip().lower()
        results[uid] = {"is_correct": ok, "answer": given, "correct": correct_ans}
        if ok:
            s["scores"][uid] = s["scores"].get(uid, 0) + 1

        # DB 저장
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO round_answers
                        (session_id, round_number, word_id, user_id, chosen_answer, is_correct, answered_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (session_id, round_number, user_id) DO NOTHING
                    """,
                    (session_id, round_number, word["id"], uid, given, ok),
                )
            conn.commit()
        except Exception as e:
            print(f"[round_answers 저장 오류] {e}")

    # 각 플레이어에게 라운드 결과 전송 (상대방 정답 여부 포함)
    for i, uid in enumerate(player_ids):
        partner_id = player_ids[1 - i]
        await send_to(session_id, uid, {
            "type": "round_result",
            "round": round_number,
            "your_correct": results[uid]["is_correct"],
            "partner_correct": results[partner_id]["is_correct"],
            "correct_answer": results[uid]["correct"],
            "your_answer": results[uid]["answer"],
        })

    # 3초 후 다음 라운드 또는 종료
    await asyncio.sleep(3)
    total = s["config"]["total_rounds"]
    if round_number < total:
        await start_round(session_id, round_number + 1, conn)
    else:
        await finish_game(session_id, conn)


async def finish_game(session_id: str, conn) -> None:
    """게임 종료: 승자 결정 → DB 업데이트 → game_over 전송"""
    s = _sessions.get(session_id)
    if not s:
        return

    player_ids = list(s["connections"].keys())
    scores = s["scores"]
    if len(player_ids) < 2:
        return

    a_id, b_id = player_ids[0], player_ids[1]
    a_sc, b_sc = scores.get(a_id, 0), scores.get(b_id, 0)
    winner_id = a_id if a_sc > b_sc else (b_id if b_sc > a_sc else None)

    # DB 업데이트
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE game_sessions
                SET status = 'finished', winner_id = %s, finished_at = NOW()
                WHERE id = %s
                """,
                (winner_id, session_id),
            )
        conn.commit()
    except Exception as e:
        print(f"[game_sessions 업데이트 오류] {e}")

    # 각 플레이어에게 결과 전송
    for i, uid in enumerate(player_ids):
        partner_id = player_ids[1 - i]
        await send_to(session_id, uid, {
            "type": "game_over",
            "winner_id": winner_id,
            "your_score": scores.get(uid, 0),
            "partner_score": scores.get(partner_id, 0),
        })
