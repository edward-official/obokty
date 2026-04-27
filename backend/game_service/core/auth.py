import os
from jose import jwt
from dotenv import load_dotenv
from fastapi import HTTPException, status
from core.database import get_connection

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def get_user_from_token(token: str) -> dict:
    """JWT → DB 조회로 유저 정보 반환"""
    from jose import JWTError
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 토큰입니다.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 토큰입니다.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, native_language, partner_id FROM users WHERE id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="사용자를 찾을 수 없습니다.")
            return {
                "id": str(row[0]),
                "email": row[1],
                "native_language": row[2],
                "partner_id": str(row[3]) if row[3] else None,
            }
    finally:
        conn.close()


def get_current_user_dep(token: str):
    """REST 엔드포인트용 의존성"""
    from fastapi import Depends
    from fastapi.security import OAuth2PasswordBearer
    return get_user_from_token(token)
