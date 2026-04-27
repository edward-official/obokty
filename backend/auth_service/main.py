from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.auth import router as auth_router
from routers.couple import router as couple_router

app = FastAPI(
    title="ObokTy Auth Service",
    description="회원가입, 로그인(JWT), 커플 연결 요청/수락 처리",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(couple_router)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "auth_service"}
