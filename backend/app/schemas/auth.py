from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    organization_name: str
    organization_slug: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("The password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("The password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("The password must contain at least one number")
        return v

    @field_validator("organization_slug")
    @classmethod
    def slug_format(cls, v: str) -> str:
        import re
        if not re.match(r"^[a-z0-9-]+$", v):
            raise ValueError("The slug can only contain lowercase letters, numbers, and hyphens")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    phone_number: str | None = None
    is_active: bool
    organization_id: UUID
    two_factor_enabled: bool = False
    last_login_at: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    tokens: TokenResponse
    user: UserResponse


class TwoFactorChallengeResponse(BaseModel):
    requires_two_factor: bool = True
    challenge_token: str
    user: UserResponse


class TwoFactorEnableResponse(BaseModel):
    setup_token: str
    qr_code_base64: str
    issuer: str
    account_name: str


class TwoFactorVerifyRequest(BaseModel):
    code: str | None = None
    challenge_token: str | None = None
    setup_token: str | None = None
    backup_code: str | None = None
    delivery_method: Literal["sms", "email"] | None = None


class TwoFactorVerifyResponse(BaseModel):
    verified: bool = True
    tokens: TokenResponse | None = None
    user: UserResponse | None = None


class TwoFactorBackupCodesResponse(BaseModel):
    backup_codes: list[str]


class TwoFactorDisableRequest(BaseModel):
    password: str


class TwoFactorDeliveryRequest(BaseModel):
    challenge_token: str