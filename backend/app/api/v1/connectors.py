"""
connectors.py  —  api/v1/connectors.py
Router FastAPI para los conectores de evidencias automáticas.
Sigue el patrón de evidences.py: APIRouter con Depends(get_current_org) y Depends(get_db).

Tickets:
  DANI-BE-021  Google Workspace
  DANI-BE-022  Microsoft 365
  DANI-BE-023  AWS
  DANI-BE-024  GitHub
"""

import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_org
from app.db.database import get_db
from app.models.organization import Organization
from app.services import connector_service

router = APIRouter(prefix="/connectors", tags=["connectors"])


# ── Schemas de respuesta ──────────────────────────────────────────────────────

class ConnectorStatusResponse(BaseModel):
    type: str
    status: str
    is_connected: bool
    last_sync_at: str | None = None
    last_sync_error: str | None = None
    auto_sync_enabled: bool = False
    token_expires_at: str | None = None


class SyncResponse(BaseModel):
    success: bool
    connector_type: str
    data: dict = Field(default_factory=dict)


class AwsConfigureRequest(BaseModel):
    access_key_id: str = Field(..., min_length=16, max_length=128)
    secret_access_key: str = Field(..., min_length=1)
    region: str = Field(..., min_length=1, max_length=32)


# ── Helper: genera state token con org_id embebido ────────────────────────────

def _build_state(org_id: UUID) -> str:
    """
    El state OAuth codifica el org_id para recuperarlo en el callback.
    Formato: <org_id>:<random_nonce>
    """
    nonce = secrets.token_urlsafe(16)
    return f"{org_id}:{nonce}"


def _parse_state(state: str) -> UUID:
    """Extrae y valida el org_id del state token."""
    try:
        org_id_str = state.split(":")[0]
        return UUID(org_id_str)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State OAuth inválido o corrupto",
        )


# ═══════════════════════════════════════════════════════════════
# DANI-BE-021: Google Workspace
# ═══════════════════════════════════════════════════════════════

@router.get("/google/auth", summary="Iniciar OAuth Google Workspace")
def google_auth(
    org: Organization = Depends(get_current_org),
):
    """
    Redirige al usuario al flujo OAuth 2.0 de Google.
    El state incluye el org_id para recuperarlo en el callback.
    """
    state = _build_state(org.id)
    auth_url = connector_service.get_google_auth_url(org_id=org.id, state_token=state)
    return RedirectResponse(url=auth_url)


@router.get("/google/callback", summary="Callback OAuth Google Workspace")
def google_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    """
    Google redirige aquí con el código de autorización.
    Intercambia el código por tokens y los guarda encriptados.
    """
    org_id = _parse_state(state)
    connector_service.handle_google_callback(code=code, org_id=org_id, db=db)
    return {"message": "Google Workspace conectado correctamente", "status": "connected"}


@router.post("/google/sync", response_model=SyncResponse, summary="Sincronizar Google Workspace")
def google_sync(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    """
    Dispara una sincronización manual con Google Workspace Admin SDK.
    Recolecta: usuarios, configuración MFA, grupos.
    """
    data = connector_service.sync_google_workspace(org_id=org.id, db=db)
    return SyncResponse(success=True, connector_type="google_workspace", data=data)


@router.get("/google/status", response_model=ConnectorStatusResponse, summary="Estado conector Google")
def google_status(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    result = connector_service.get_connector_status(db=db, org_id=org.id, connector_type="google_workspace")
    return ConnectorStatusResponse(**result)


@router.delete("/google", status_code=status.HTTP_204_NO_CONTENT, summary="Desconectar Google Workspace")
def google_disconnect(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    """Revoca tokens y desconecta Google Workspace."""
    connector_service.disconnect_connector(db=db, org_id=org.id, connector_type="google_workspace")


# ═══════════════════════════════════════════════════════════════
# DANI-BE-022: Microsoft 365
# ═══════════════════════════════════════════════════════════════

@router.get("/microsoft/auth", summary="Iniciar OAuth Microsoft 365")
def microsoft_auth(
    org: Organization = Depends(get_current_org),
):
    state = _build_state(org.id)
    auth_url = connector_service.get_microsoft_auth_url(org_id=org.id, state_token=state)
    return RedirectResponse(url=auth_url)


@router.get("/microsoft/callback", summary="Callback OAuth Microsoft 365")
def microsoft_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    org_id = _parse_state(state)
    connector_service.handle_microsoft_callback(code=code, org_id=org_id, db=db)
    return {"message": "Microsoft 365 conectado correctamente", "status": "connected"}


@router.post("/microsoft/sync", response_model=SyncResponse, summary="Sincronizar Microsoft 365")
def microsoft_sync(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    """
    Sincroniza con Microsoft Graph API.
    Recolecta: usuarios Azure AD, políticas de acceso condicional.
    """
    data = connector_service.sync_microsoft_365(org_id=org.id, db=db)
    return SyncResponse(success=True, connector_type="microsoft_365", data=data)


@router.get("/microsoft/status", response_model=ConnectorStatusResponse, summary="Estado conector Microsoft")
def microsoft_status(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    result = connector_service.get_connector_status(db=db, org_id=org.id, connector_type="microsoft_365")
    return ConnectorStatusResponse(**result)


@router.delete("/microsoft", status_code=status.HTTP_204_NO_CONTENT, summary="Desconectar Microsoft 365")
def microsoft_disconnect(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    connector_service.disconnect_connector(db=db, org_id=org.id, connector_type="microsoft_365")


# ═══════════════════════════════════════════════════════════════
# DANI-BE-023: AWS
# ═══════════════════════════════════════════════════════════════

@router.post("/aws/configure", summary="Configurar credenciales AWS")
def aws_configure(
    body: AwsConfigureRequest,
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    """
    AWS no usa OAuth. Recibe Access Key ID + Secret Key + región.
    Valida contra STS antes de guardar (sts:GetCallerIdentity).
    """
    connector_service.configure_aws(
        org_id=org.id,
        access_key_id=body.access_key_id,
        secret_access_key=body.secret_access_key,
        region=body.region,
        db=db,
    )
    return {"message": "AWS configurado correctamente", "status": "connected"}


@router.post("/aws/sync", response_model=SyncResponse, summary="Sincronizar AWS")
def aws_sync(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    """
    Sincroniza con AWS SDK.
    Recolecta: usuarios IAM + MFA, buckets S3, trails CloudTrail.
    """
    data = connector_service.sync_aws(org_id=org.id, db=db)
    return SyncResponse(success=True, connector_type="aws", data=data)


@router.get("/aws/status", response_model=ConnectorStatusResponse, summary="Estado conector AWS")
def aws_status(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    result = connector_service.get_connector_status(db=db, org_id=org.id, connector_type="aws")
    return ConnectorStatusResponse(**result)


@router.delete("/aws", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar configuración AWS")
def aws_disconnect(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    connector_service.disconnect_connector(db=db, org_id=org.id, connector_type="aws")


# ═══════════════════════════════════════════════════════════════
# DANI-BE-024: GitHub
# ═══════════════════════════════════════════════════════════════

@router.get("/github/auth", summary="Iniciar OAuth GitHub")
def github_auth(
    org: Organization = Depends(get_current_org),
):
    state = _build_state(org.id)
    auth_url = connector_service.get_github_auth_url(org_id=org.id, state_token=state)
    return RedirectResponse(url=auth_url)


@router.get("/github/callback", summary="Callback OAuth GitHub")
def github_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    org_id = _parse_state(state)
    connector_service.handle_github_callback(code=code, org_id=org_id, db=db)
    return {"message": "GitHub conectado correctamente", "status": "connected"}


@router.post("/github/sync", response_model=SyncResponse, summary="Sincronizar GitHub")
def github_sync(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    data = connector_service.sync_github(org_id=org.id, db=db)
    return SyncResponse(success=True, connector_type="github", data=data)


@router.get("/github/status", response_model=ConnectorStatusResponse, summary="Estado conector GitHub")
def github_status(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    result = connector_service.get_connector_status(db=db, org_id=org.id, connector_type="github")
    return ConnectorStatusResponse(**result)


@router.get("/github/repos", summary="Listar repositorios conectados")
def github_list_repos(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    """Lista los repos disponibles del token GitHub conectado."""
    data = connector_service.sync_github(org_id=org.id, db=db)
    return {"repos": data.get("repos", [])}


@router.delete("/github", status_code=status.HTTP_204_NO_CONTENT, summary="Desconectar GitHub")
def github_disconnect(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    connector_service.disconnect_connector(db=db, org_id=org.id, connector_type="github")
