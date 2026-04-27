from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SessionCreate(BaseModel):
    total_rounds: int = Field(..., ge=1, le=20, description="총 문제 수 (1~20)")
    time_limit_sec: int = Field(..., ge=5, le=60, description="문제당 제한 시간 초 (5~60)")


class SessionResponse(BaseModel):
    session_id: str
    total_rounds: int
    time_limit_sec: int
    status: str


class HistoryItem(BaseModel):
    session_id: str
    total_rounds: int
    time_limit_sec: int
    winner_id: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
