from datetime import date
from pydantic import BaseModel, EmailStr


class AstroRequest(BaseModel):
    first_name: str
    last_name: str
    dob: date
    country: str


class AstroResponse(BaseModel):
    zodiac: str
    luck_score: int
    energy_level: str
    lucky_color: str
    lucky_color_hex: str
    message: str
    personality: str
    dos: list[str]
    donts: list[str]
    daily_message: str
    energy_status: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInfo(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    created_at: str


class AuthResponse(BaseModel):
    token: str
    user: UserInfo


class CompatibilityUser(BaseModel):
    first_name: str
    last_name: str
    dob: date
    country: str


class CompatibilityRequest(BaseModel):
    user_a: CompatibilityUser
    user_b: CompatibilityUser


class CompatibilityResponse(BaseModel):
    sign_a: str
    sign_b: str
    match_score: int
    compatibility: str
    summary: str


class HistoryItem(AstroResponse):
    id: int
    created_at: str
