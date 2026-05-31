from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_org
from app.models.organization import Organization
from app.schemas.asset import (
    CreateAssetRequest,
    UpdateAssetRequest,
    AssetResponse,
    AssetSummaryResponse,
)
from app.services import asset_service

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=list[AssetResponse])
def list_assets(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return asset_service.list_assets(org.id, db)


@router.get("/summary", response_model=AssetSummaryResponse)
def get_summary(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return asset_service.get_summary(org.id, db)


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    data: CreateAssetRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return asset_service.create_asset(data, org.id, db)


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return asset_service.get_asset(asset_id, org.id, db)


@router.patch("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: UUID,
    data: UpdateAssetRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return asset_service.update_asset(asset_id, data, org.id, db)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    asset_service.delete_asset(asset_id, org.id, db)