from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from core.security import decode_token
from core.database import get_connection

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """JWT 토큰으로 현재 유저 조회"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, native_language, partner_id FROM users WHERE id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            if row is None:
                raise credentials_exception
            return {
                "id": str(row[0]),
                "email": row[1],
                "native_language": row[2],
                "partner_id": str(row[3]) if row[3] else None,
            }
    finally:
        conn.close()
