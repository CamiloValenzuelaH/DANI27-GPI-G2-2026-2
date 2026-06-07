from __future__ import annotations

import base64
import hmac
import hashlib
import secrets
from datetime import datetime, timezone
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
from app.services.notification_service import send_email_message
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
_SMS_OTP_TTL_SECONDS = 5 * 60
_EMAIL_OTP_TTL_SECONDS = 10 * 60
_SMS_SEND_WINDOW_SECONDS = 60 * 60
_MAX_OTP_ATTEMPTS = 3


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


def _delivery_key(user_id: str, delivery_method: Literal["sms", "email"]) -> str:
    return f"{delivery_method}_otp:{user_id}"


def _delivery_attempts_key(user_id: str, delivery_method: Literal["sms", "email"]) -> str:
    return f"{delivery_method}_otp_attempts:{user_id}"


def _delivery_send_key(user_id: str, delivery_method: Literal["sms", "email"]) -> str:
    return f"{delivery_method}_otp_send:{user_id}"


def _delivery_ttl_seconds(delivery_method: Literal["sms", "email"]) -> int:
    return _SMS_OTP_TTL_SECONDS if delivery_method == "sms" else _EMAIL_OTP_TTL_SECONDS


def _clear_delivery_code(user_id: str, delivery_method: Literal["sms", "email"]) -> None:
    _rate_limiter.delete(_delivery_key(user_id, delivery_method), _delivery_attempts_key(user_id, delivery_method))


def _store_delivery_code(user_id: str, delivery_method: Literal["sms", "email"], code: str) -> None:
    _rate_limiter.setex(
        _delivery_key(user_id, delivery_method),
        _delivery_ttl_seconds(delivery_method),
        hashlib.sha256(code.encode("utf-8")).hexdigest(),
    )
    _rate_limiter.delete(_delivery_attempts_key(user_id, delivery_method))


def _rate_limit_delivery_sends(user_id: str, delivery_method: Literal["sms", "email"]) -> None:
    if delivery_method == "sms":
        redis_key = _delivery_send_key(user_id, delivery_method)
        count = _rate_limiter.incr(redis_key)
        if count == 1:
            _rate_limiter.expire(redis_key, _SMS_SEND_WINDOW_SECONDS)
        if count > 3:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many SMS codes requested, please try again later",
            )
        return

    _rate_limit(_delivery_send_key(user_id, delivery_method), limit=5, window_seconds=60)


def _log_delivery_audit(
    db: Session,
    *,
    user: User,
    action: str,
    method: str,
    success: bool,
    http_status: int,
    request: Request | None,
    details: dict | None = None,
) -> None:
    _audit(
        db,
        user=user,
        action=action,
        resource="auth/2fa",
        details={"method": method, **(details or {})},
        success=success,
        http_status=http_status,
        request=request,
    )


def _verify_delivery_code(user_id: str, delivery_method: Literal["sms", "email"], code: str) -> bool:
    redis_key = _delivery_key(user_id, delivery_method)
    attempts_key = _delivery_attempts_key(user_id, delivery_method)
    stored_hash = _rate_limiter.get(redis_key)
    if not stored_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired 2FA code")

    attempt_count = int(_rate_limiter.get(attempts_key) or 0)
    if attempt_count >= _MAX_OTP_ATTEMPTS:
        _clear_delivery_code(user_id, delivery_method)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired 2FA code")

    candidate_hash = hashlib.sha256(code.encode("utf-8")).hexdigest()
    if hmac.compare_digest(candidate_hash, stored_hash):
        _clear_delivery_code(user_id, delivery_method)
        return True

    attempt_count = _rate_limiter.incr(attempts_key)
    if attempt_count == 1:
        _rate_limiter.expire(attempts_key, _delivery_ttl_seconds(delivery_method))
    if attempt_count >= _MAX_OTP_ATTEMPTS:
        _clear_delivery_code(user_id, delivery_method)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired 2FA code")


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
        used_method = "backup_code"
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
        try:
            verified = _verify_delivery_code(str(user.id), data.delivery_method, code)
            if verified:
                used_method = data.delivery_method
        except HTTPException:
            _log_delivery_audit(
                db,
                user=user,
                action=f"MFA_{data.delivery_method.upper()}_VERIFY_FAILED",
                method=data.delivery_method,
                success=False,
                http_status=status.HTTP_401_UNAUTHORIZED,
                request=request,
                details={"reason": "invalid_or_expired_code"},
            )
            raise
    else:
        code = _normalize_code(data.code or "")
        if not code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A TOTP code is required")
        secret = decrypt(user.two_factor_secret_encrypted)
        verified = pyotp.TOTP(secret).verify(code, valid_window=1)

    if not verified:
        _log_delivery_audit(
            db,
            user=user,
            action="MFA_VERIFY_FAILED",
            method=used_method,
            success=False,
            http_status=status.HTTP_401_UNAUTHORIZED,
            request=request,
            details={"reason": "invalid_code"},
        )
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
    if not (settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_phone_number):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Twilio is not configured")

    client = TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
    client.messages.create(body=message, from_=settings.twilio_phone_number, to=phone_number)


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
    user = _get_user_from_token(db, data.challenge_token, "two_factor_login")
    _rate_limit_delivery_sends(str(user.id), "sms")
    if not user.phone_number:
        _log_delivery_audit(
            db,
            user=user,
            action="MFA_SMS_SENT_FAILED",
            method="sms",
            success=False,
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
            details={"reason": "delivery_unavailable"},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to send the SMS code right now")

    code = f"{secrets.randbelow(1_000_000):06d}"
    _store_delivery_code(str(user.id), "sms", code)

    try:
        _send_sms_message(
            user.phone_number,
            f"Your Dani27001 verification code is {code}. It expires in {_SMS_OTP_TTL_SECONDS // 60} minutes.",
        )
    except Exception:
        _clear_delivery_code(str(user.id), "sms")
        _log_delivery_audit(
            db,
            user=user,
            action="MFA_SMS_SENT_FAILED",
            method="sms",
            success=False,
            http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
            request=request,
            details={"reason": "delivery_failed"},
        )
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Unable to send the SMS code right now")

    _log_delivery_audit(
        db,
        user=user,
        action="MFA_SMS_SENT",
        method="sms",
        success=True,
        http_status=status.HTTP_200_OK,
        request=request,
    )
    return {"sent": True, "delivery_method": "sms"}


def send_email_code(data: TwoFactorDeliveryRequest, db: Session, request: Request) -> dict:
    user = _get_user_from_token(db, data.challenge_token, "two_factor_login")
    _rate_limit_delivery_sends(str(user.id), "email")

    code = f"{secrets.randbelow(1_000_000):06d}"
    _store_delivery_code(str(user.id), "email", code)

    try:
        send_email_message(
            user.email,
            "Your Dani27001 verification code",
            (
                "<html><body style='font-family:Arial,sans-serif;'>"
                f"<p>Your verification code is <strong>{code}</strong>.</p>"
                f"<p>It expires in {_EMAIL_OTP_TTL_SECONDS // 60} minutes.</p>"
                "</body></html>"
            ),
        )
    except Exception:
        _clear_delivery_code(str(user.id), "email")
        _log_delivery_audit(
            db,
            user=user,
            action="MFA_EMAIL_SENT_FAILED",
            method="email",
            success=False,
            http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
            request=request,
            details={"reason": "delivery_failed"},
        )
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Unable to send the email code right now")

    _log_delivery_audit(
        db,
        user=user,
        action="MFA_EMAIL_SENT",
        method="email",
        success=True,
        http_status=status.HTTP_200_OK,
        request=request,
    )
    return {"sent": True, "delivery_method": "email"}
