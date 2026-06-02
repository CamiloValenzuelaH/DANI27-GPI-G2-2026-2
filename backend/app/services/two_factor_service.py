from __future__ import annotations

import base64
import hashlib
import secrets
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from io import BytesIO
from typing import Literal

import pyotp
import qrcode
import redis
from argon2 import PasswordHasher, exceptions as argon2_exceptions
from argon2.low_level import Type
from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session
from twilio.rest import Client as TwilioClient

from app.core.config import settings
from app.core.crypto import encrypt, decrypt
from app.core.security import create_temporary_token, verify_password
from app.models.audit_log import AuditLog
from app.models.two_factor_backup_code import TwoFactorBackupCode
from app.models.user import User
from app.schemas.auth import (
    TokenResponse,
    TwoFactorBackupCodesResponse,
    TwoFactorChallengeResponse,
    TwoFactorDeliveryRequest,
    TwoFactorDisableRequest,
    TwoFactorEnableResponse,
    TwoFactorVerifyRequest,
    TwoFactorVerifyResponse,
    UserResponse,
)
from app.services.auth_service import issue_tokens

_argon_hasher = PasswordHasher(type=Type.ID)
_rate_limiter = redis.Redis.from_url(settings.redis_url, decode_responses=True)


def _client_key(request: Request | None) -> str:
    if not request or not request.client:
        return "unknown"
    return request.client.host or "unknown"


def _rate_limit(key: str, limit: int = 5, window_seconds: int = 60) -> None:
    redis_key = f"rate-limit:2fa:{key}"
    count = _rate_limiter.incr(redis_key)
    if count == 1:
        _rate_limiter.expire(redis_key, window_seconds)
    if count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many 2FA requests, please try again later",
        )


def _normalize_code(code: str) -> str:
    return "".join(ch for ch in code.upper() if ch.isalnum())


def _generate_backup_code() -> str:
    raw = secrets.token_hex(4).upper()
    return f"{raw[:4]}-{raw[4:]}"


def _audit(
    db: Session,
    *,
    user: User | None,
    action: str,
    resource: str,
    details: dict,
    success: bool,
    http_status: int,
    request: Request | None = None,
) -> None:
    try:
        previous = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).first()
        record = AuditLog(
            user_id=str(user.id) if user else None,
            user_role=None,
            action=action,
            resource=resource,
            details=details,
            timestamp=datetime.now(timezone.utc),
            ip_address=_client_key(request),
            user_agent=request.headers.get("user-agent") if request else None,
            http_status=http_status,
            success=success,
            previous_hash=previous.current_hash if previous else None,
            current_hash="",
        )
        record.current_hash = record.compute_hash()
        db.add(record)
        db.commit()
    except Exception:
        db.rollback()


def _build_qr_image_base64(otpauth_uri: str) -> str:
    qr = qrcode.QRCode(border=2, box_size=8)
    qr.add_data(otpauth_uri)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def _build_totp_secret() -> str:
    return pyotp.random_base32()


def _get_user_from_token(db: Session, token: str, purpose: str) -> User:
    from app.core.security import decode_access_token

    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA token")

    if payload.get("purpose") != purpose:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA token purpose")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA token subject")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def enable_two_factor(current_user: User, db: Session, request: Request) -> TwoFactorEnableResponse:
    _rate_limit(f"enable:{current_user.id}")

    if current_user.two_factor_enabled:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="2FA is already enabled")

    secret = _build_totp_secret()
    current_user.two_factor_pending_secret_encrypted = encrypt(secret)
    current_user.two_factor_secret_encrypted = None
    current_user.two_factor_enabled = False
    db.commit()

    otpauth_uri = pyotp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name=settings.two_factor_issuer,
    )

    setup_token = create_temporary_token(
        subject=str(current_user.id),
        purpose="two_factor_setup",
        extra={"email": current_user.email},
        minutes=settings.two_factor_setup_expire_minutes,
    )

    _audit(
        db,
        user=current_user,
        action="MFA_ENABLE_STARTED",
        resource="auth/2fa",
        details={"issuer": settings.two_factor_issuer},
        success=True,
        http_status=status.HTTP_200_OK,
        request=request,
    )

    return TwoFactorEnableResponse(
        setup_token=setup_token,
        qr_code_base64=f"data:image/png;base64,{_build_qr_image_base64(otpauth_uri)}",
        issuer=settings.two_factor_issuer,
        account_name=current_user.email,
    )


def verify_two_factor(data: TwoFactorVerifyRequest, db: Session, request: Request) -> TwoFactorVerifyResponse:
    token = data.setup_token or data.challenge_token
    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A 2FA token is required")

    purpose = "two_factor_setup" if data.setup_token else "two_factor_login"
    user = _get_user_from_token(db, token, purpose)
    _rate_limit(f"verify:{user.id}")

    if data.setup_token:
        pending_secret = user.two_factor_pending_secret_encrypted
        if not pending_secret:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA setup is not pending")

        secret = decrypt(pending_secret)
        code = _normalize_code(data.code or "")
        if not code or not pyotp.TOTP(secret).verify(code, valid_window=1):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA code")

        user.two_factor_secret_encrypted = pending_secret
        user.two_factor_pending_secret_encrypted = None
        user.two_factor_enabled = True
        user.two_factor_verified_at = datetime.now(timezone.utc)
        db.commit()

        _audit(
            db,
            user=user,
            action="MFA_ENABLED",
            resource="auth/2fa",
            details={"method": "totp"},
            success=True,
            http_status=status.HTTP_200_OK,
            request=request,
        )

        return TwoFactorVerifyResponse(verified=True, user=UserResponse.model_validate(user))

    if not user.two_factor_enabled or not user.two_factor_secret_encrypted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled for this account")

    used_method = "totp"
    verified = False

    if data.backup_code:
        normalized_backup = _normalize_code(data.backup_code)
        for backup_code in db.query(TwoFactorBackupCode).filter(
            TwoFactorBackupCode.user_id == user.id,
            TwoFactorBackupCode.used_at.is_(None),
        ).all():
            try:
                if _argon_hasher.verify(backup_code.code_hash, normalized_backup):
                    backup_code.used_at = datetime.now(timezone.utc)
                    verified = True
                    used_method = "backup_code"
                    db.commit()
                    _audit(
                        db,
                        user=user,
                        action="BACKUP_CODE_USED",
                        resource="auth/2fa",
                        details={"method": "backup_code"},
                        success=True,
                        http_status=status.HTTP_200_OK,
                        request=request,
                    )
                    break
            except argon2_exceptions.VerifyMismatchError:
                continue
            except Exception:
                continue
    elif data.delivery_method in {"sms", "email"}:
        code = _normalize_code(data.code or "")
        if not code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A delivery code is required")
        redis_key = f"2fa:delivery:{token}:{data.delivery_method}"
        stored_hash = _rate_limiter.get(redis_key)
        if stored_hash and hashlib.sha256(code.encode("utf-8")).hexdigest() == stored_hash:
            verified = True
            _rate_limiter.delete(redis_key)
            used_method = data.delivery_method
    else:
        code = _normalize_code(data.code or "")
        if not code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A TOTP code is required")
        secret = decrypt(user.two_factor_secret_encrypted)
        verified = pyotp.TOTP(secret).verify(code, valid_window=1)

    if not verified:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA code")

    user.last_login_at = datetime.now(timezone.utc)
    tokens = issue_tokens(db, user)
    db.commit()
    db.refresh(user)

    _audit(
        db,
        user=user,
        action="MFA_VERIFY",
        resource="auth/2fa",
        details={"method": used_method},
        success=True,
        http_status=status.HTTP_200_OK,
        request=request,
    )

    return TwoFactorVerifyResponse(
        verified=True,
        tokens=tokens,
        user=UserResponse.model_validate(user),
    )


def disable_two_factor(current_user: User, data: TwoFactorDisableRequest, db: Session, request: Request) -> TwoFactorVerifyResponse:
    _rate_limit(f"disable:{current_user.id}")

    if not verify_password(data.password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")

    current_user.two_factor_enabled = False
    current_user.two_factor_secret_encrypted = None
    current_user.two_factor_pending_secret_encrypted = None
    current_user.two_factor_verified_at = None
    db.query(TwoFactorBackupCode).filter(TwoFactorBackupCode.user_id == current_user.id).delete()
    db.commit()

    _audit(
        db,
        user=current_user,
        action="MFA_DISABLED",
        resource="auth/2fa",
        details={"method": "password_confirmed"},
        success=True,
        http_status=status.HTTP_200_OK,
        request=request,
    )

    return TwoFactorVerifyResponse(verified=True, user=UserResponse.model_validate(current_user))


def generate_backup_codes(current_user: User, db: Session, request: Request) -> TwoFactorBackupCodesResponse:
    _rate_limit(f"backup-codes:{current_user.id}")

    if not current_user.two_factor_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA must be enabled first")

    db.query(TwoFactorBackupCode).filter(TwoFactorBackupCode.user_id == current_user.id).delete()

    raw_codes: list[str] = []
    for _ in range(10):
        raw_code = _generate_backup_code()
        raw_codes.append(raw_code)
        db.add(
            TwoFactorBackupCode(
                user_id=current_user.id,
                code_hash=_argon_hasher.hash(_normalize_code(raw_code)),
            )
        )

    db.commit()

    _audit(
        db,
        user=current_user,
        action="BACKUP_CODES_GENERATED",
        resource="auth/2fa",
        details={"count": len(raw_codes)},
        success=True,
        http_status=status.HTTP_200_OK,
        request=request,
    )

    return TwoFactorBackupCodesResponse(backup_codes=raw_codes)


def _store_delivery_code(token: str, delivery_method: Literal["sms", "email"], code: str) -> None:
    redis_key = f"2fa:delivery:{token}:{delivery_method}"
    _rate_limiter.setex(redis_key, settings.two_factor_challenge_expire_minutes * 60, hashlib.sha256(code.encode("utf-8")).hexdigest())


def _send_sms_message(phone_number: str, message: str) -> None:
    if not (settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_phone):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Twilio is not configured")

    client = TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
    client.messages.create(body=message, from_=settings.twilio_from_phone, to=phone_number)


def _send_email_message(email: str, subject: str, body: str) -> None:
    if not (settings.smtp_host and settings.smtp_from_email):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="SMTP email fallback is not configured")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = email
    msg.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_username:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(msg)


def send_sms_code(data: TwoFactorDeliveryRequest, db: Session, request: Request) -> dict:
    _rate_limit(f"send-sms:{data.challenge_token}")
    user = _get_user_from_token(db, data.challenge_token, "two_factor_login")
    if not user.phone_number:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The user has no phone number configured")

    code = f"{secrets.randbelow(1_000_000):06d}"
    _store_delivery_code(data.challenge_token, "sms", code)
    _send_sms_message(
        user.phone_number,
        f"Your Dani27001 verification code is {code}. It expires in {settings.two_factor_challenge_expire_minutes} minutes.",
    )

    _audit(
        db,
        user=user,
        action="MFA_SMS_SENT",
        resource="auth/2fa",
        details={"method": "sms"},
        success=True,
        http_status=status.HTTP_200_OK,
        request=request,
    )
    return {"sent": True, "delivery_method": "sms"}


def send_email_code(data: TwoFactorDeliveryRequest, db: Session, request: Request) -> dict:
    _rate_limit(f"send-email:{data.challenge_token}")
    user = _get_user_from_token(db, data.challenge_token, "two_factor_login")

    code = f"{secrets.randbelow(1_000_000):06d}"
    _store_delivery_code(data.challenge_token, "email", code)
    _send_email_message(
        user.email,
        "Your Dani27001 verification code",
        f"Your verification code is {code}. It expires in {settings.two_factor_challenge_expire_minutes} minutes.",
    )

    _audit(
        db,
        user=user,
        action="MFA_EMAIL_SENT",
        resource="auth/2fa",
        details={"method": "email"},
        success=True,
        http_status=status.HTTP_200_OK,
        request=request,
    )
    return {"sent": True, "delivery_method": "email"}
