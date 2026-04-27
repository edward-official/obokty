from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.game import router as game_router
from routers.ws import router as ws_router

app = FastAPI(
    title="ObokTy Game Service",
    description="WebSocket 기반 실시간 언어 퀴즈 게임",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game_router)
app.include_router(ws_router)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "game_service"}
