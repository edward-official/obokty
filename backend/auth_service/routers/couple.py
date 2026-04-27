from fastapi import APIRouter, HTTPException, status, Depends
from schemas.couple import CoupleRequestCreate, CoupleRequestResponse
from core.database import get_connection
from core.deps import get_current_user
from typing import List

router = APIRouter(prefix="/couple", tags=["couple"])


@router.post("/request", status_code=status.HTTP_201_CREATED)
def send_couple_request(body: CoupleRequestCreate, current_user: dict = Depends(get_current_user)):
    """상대방 이메일로 커플 연결 요청 전송"""
    if current_user["partner_id"]:
        raise HTTPException(status_code=400, detail="이미 커플로 연결되어 있습니다.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 수신자 조회
            cur.execute("SELECT id FROM users WHERE email = %s", (body.receiver_email,))
            receiver = cur.fetchone()
            if not receiver:
                raise HTTPException(status_code=404, detail="해당 이메일의 사용자를 찾을 수 없습니다.")

            receiver_id = str(receiver[0])
            if receiver_id == current_user["id"]:
                raise HTTPException(status_code=400, detail="자기 자신에게 요청을 보낼 수 없습니다.")

            # 중복 pending 요청 확인
            cur.execute(
                """
                SELECT id FROM couple_requests
                WHERE sender_id = %s AND receiver_id = %s AND status = 'pending'
                """,
                (current_user["id"], receiver_id),
            )
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="이미 요청을 보냈습니다.")

            cur.execute(
                "INSERT INTO couple_requests (sender_id, receiver_id) VALUES (%s, %s) RETURNING id",
                (current_user["id"], receiver_id),
            )
            request_id = cur.fetchone()[0]
            conn.commit()
            return {"message": "커플 연결 요청을 보냈습니다.", "request_id": request_id}
    finally:
        conn.close()


@router.get("/requests", response_model=List[CoupleRequestResponse])
def get_couple_requests(current_user: dict = Depends(get_current_user)):
    """받은 커플 연결 요청 목록 조회"""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT cr.id, cr.sender_id, u.email, cr.status, cr.created_at
                FROM couple_requests cr
                JOIN users u ON u.id = cr.sender_id
                WHERE cr.receiver_id = %s AND cr.status = 'pending'
                ORDER BY cr.created_at DESC
                """,
                (current_user["id"],),
            )
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "sender_id": str(r[1]),
                    "sender_email": r[2],
                    "status": r[3],
                    "created_at": r[4],
                }
                for r in rows
            ]
    finally:
        conn.close()


@router.post("/accept/{request_id}")
def accept_couple_request(request_id: int, current_user: dict = Depends(get_current_user)):
    """커플 연결 요청 수락 → 양방향 partner_id 업데이트"""
    if current_user["partner_id"]:
        raise HTTPException(status_code=400, detail="이미 커플로 연결되어 있습니다.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT sender_id FROM couple_requests
                WHERE id = %s AND receiver_id = %s AND status = 'pending'
                """,
                (request_id, current_user["id"]),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")

            sender_id = str(row[0])

            # 상태 변경
            cur.execute(
                "UPDATE couple_requests SET status = 'accepted' WHERE id = %s",
                (request_id,),
            )
            # 양방향 partner_id 업데이트
            cur.execute(
                "UPDATE users SET partner_id = %s WHERE id = %s",
                (sender_id, current_user["id"]),
            )
            cur.execute(
                "UPDATE users SET partner_id = %s WHERE id = %s",
                (current_user["id"], sender_id),
            )
            conn.commit()
            return {"message": "커플 연결이 완료되었습니다."}
    finally:
        conn.close()


@router.post("/reject/{request_id}")
def reject_couple_request(request_id: int, current_user: dict = Depends(get_current_user)):
    """커플 연결 요청 거절"""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE couple_requests SET status = 'rejected'
                WHERE id = %s AND receiver_id = %s AND status = 'pending'
                """,
                (request_id, current_user["id"]),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")
            conn.commit()
            return {"message": "요청을 거절했습니다."}
    finally:
        conn.close()
