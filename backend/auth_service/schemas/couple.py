from pydantic import BaseModel, EmailStr
from datetime import datetime


class CoupleRequestCreate(BaseModel):
    receiver_email: EmailStr


class CoupleRequestResponse(BaseModel):
    id: int
    sender_id: str
    sender_email: str
    status: str
    created_at: datetime
