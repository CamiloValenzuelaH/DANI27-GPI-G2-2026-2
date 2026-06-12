from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.notification import Notification, NotificationPreference
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdateRequest,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * page_size
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return notifications


@router.get("/preferences", response_model=list[NotificationPreferenceResponse])
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    preferences = (
        db.query(NotificationPreference)
        .filter(NotificationPreference.user_id == current_user.id)
        .order_by(NotificationPreference.notification_type, NotificationPreference.channel)
        .all()
    )
    return preferences


@router.patch("/preferences", response_model=list[NotificationPreferenceResponse])
def update_notification_preferences(
    preferences: list[NotificationPreferenceUpdateRequest],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated: list[NotificationPreference] = []
    for item in preferences:
        pref = (
            db.query(NotificationPreference)
            .filter(
                NotificationPreference.user_id == current_user.id,
                NotificationPreference.notification_type == item.notification_type,
                NotificationPreference.channel == item.channel,
            )
            .first()
        )
        if pref is None:
            pref = NotificationPreference(
                organization_id=current_user.organization_id,
                user_id=current_user.id,
                notification_type=item.notification_type,
                channel=item.channel,
                enabled=item.enabled,
            )
            db.add(pref)
        else:
            pref.enabled = item.enabled
        updated.append(pref)

    db.commit()
    for pref in updated:
        db.refresh(pref)

    return updated


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificación no encontrada")

    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notification)
    return notification


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True, "read_at": datetime.now(timezone.utc)})
    db.commit()
    return


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificación no encontrada")

    db.delete(notification)
    db.commit()
    return
