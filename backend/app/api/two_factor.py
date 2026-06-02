from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import (
    TwoFactorBackupCodesResponse,
    TwoFactorDisableRequest,
    TwoFactorEnableResponse,
    TwoFactorDeliveryRequest,
    TwoFactorVerifyRequest,
    TwoFactorVerifyResponse,
)
from app.services import two_factor_service

router = APIRouter(prefix="/auth/2fa", tags=["auth-2fa"])


@router.post("/enable", response_model=TwoFactorEnableResponse)
def enable_two_factor(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return two_factor_service.enable_two_factor(current_user, db, request)


@router.post("/verify", response_model=TwoFactorVerifyResponse)
def verify_two_factor(
    data: TwoFactorVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    return two_factor_service.verify_two_factor(data, db, request)


@router.post("/disable", response_model=TwoFactorVerifyResponse)
def disable_two_factor(
    data: TwoFactorDisableRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return two_factor_service.disable_two_factor(current_user, data, db, request)


@router.get("/backup-codes", response_model=TwoFactorBackupCodesResponse)
def backup_codes(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return two_factor_service.generate_backup_codes(current_user, db, request)


@router.post("/send-sms")
def send_sms(
    data: TwoFactorDeliveryRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    return two_factor_service.send_sms_code(data, db, request)


@router.post("/send-email")
def send_email(
    data: TwoFactorDeliveryRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    return two_factor_service.send_email_code(data, db, request)
