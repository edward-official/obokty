from fastapi import APIRouter, HTTPException, status, Depends
from schemas.user import UserCreate, UserLogin, UserResponse, Token
from core.database import get_connection
from core.security import hash_password, verify_password, create_access_token
from core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate):
    """회원가입 - 이메일 중복 확인 후 bcrypt 해시 저장"""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (user_in.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Email is already in use.")

            hashed = hash_password(user_in.password)
            cur.execute(
                """
                INSERT INTO users (email, password_hash, native_language)
                VALUES (%s, %s, %s)
                RETURNING id, email, native_language, partner_id
                """,
                (user_in.email, hashed, user_in.native_language),
            )
            row = cur.fetchone()
            conn.commit()
            return {
                "id": str(row[0]),
                "email": row[1],
                "native_language": row[2],
                "partner_id": str(row[3]) if row[3] else None,
            }
    finally:
        conn.close()


@router.post("/login", response_model=Token)
def login(credentials: UserLogin):
    """로그인 - 이메일/비밀번호 검증 후 JWT 발급"""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, password_hash FROM users WHERE email = %s",
                (credentials.email,),
            )
            row = cur.fetchone()
            if not row or not verify_password(credentials.password, row[1]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password.",
                )
            access_token = create_access_token({"sub": str(row[0])})
            return {"access_token": access_token, "token_type": "bearer"}
    finally:
        conn.close()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """내 정보 조회 (JWT 필요)"""
    return current_user
