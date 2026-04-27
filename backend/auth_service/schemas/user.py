from pydantic import BaseModel, EmailStr
from typing import Literal, Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    native_language: Literal["ko", "pl"]


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    native_language: str
    partner_id: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
