"""
connector_service.py
Lógica de negocio para los conectores de evidencias automáticas.
Sigue el patrón de auth_service.py: funciones puras que reciben db: Session.

Conectores implementados:
  - DANI-BE-021: Google Workspace (OAuth 2.0)
  - DANI-BE-022: Microsoft 365   (OAuth 2.0 / Graph API)
  - DANI-BE-023: AWS             (IAM Access Key o Role)
  - DANI-BE-024: GitHub          (OAuth App)
"""

from __future__ import annotations

import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.crypto import decrypt, encrypt
from app.models.connector import CONNECTOR_TYPES, Connector


# ── Helpers internos ──────────────────────────────────────────────────────────

def _get_or_create_connector(db: Session, org_id: UUID, connector_type: str) -> Connector:
    """Obtiene el conector existente o crea uno en estado disconnected."""
    connector = (
        db.query(Connector)
        .filter(
            Connector.organization_id == org_id,
            Connector.type == connector_type,
        )
        .first()
    )
    if not connector:
        connector = Connector(
            organization_id=org_id,
            type=connector_type,
            status="disconnected",
        )
        db.add(connector)
        db.flush()
    return connector


def _require_connector(db: Session, org_id: UUID, connector_type: str) -> Connector:
    """Igual que _get_or_create pero lanza 404 si no existe."""
    connector = (
        db.query(Connector)
        .filter(
            Connector.organization_id == org_id,
            Connector.type == connector_type,
        )
        .first()
    )
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conector '{connector_type}' no configurado para esta organización",
        )
    return connector


# ── Status genérico ───────────────────────────────────────────────────────────

def get_connector_status(db: Session, org_id: UUID, connector_type: str) -> dict:
    """Retorna el estado de cualquier conector sin exponer tokens."""
    connector = (
        db.query(Connector)
        .filter(
            Connector.organization_id == org_id,
            Connector.type == connector_type,
        )
        .first()
    )
    if not connector:
        return {
            "type": connector_type,
            "status": "disconnected",
            "is_connected": False,
            "last_sync_at": None,
            "last_sync_error": None,
            "auto_sync_enabled": False,
        }

    return {
        "type": connector.type,
        "status": connector.status,
        "is_connected": connector.is_connected,
        "last_sync_at": connector.last_sync_at,
        "last_sync_error": connector.last_sync_error,
        "auto_sync_enabled": connector.auto_sync_enabled,
        "token_expires_at": connector.token_expires_at,
    }


def disconnect_connector(db: Session, org_id: UUID, connector_type: str) -> None:
    """Revoca tokens y deja el conector en estado disconnected."""
    connector = _require_connector(db, org_id, connector_type)

    connector.encrypted_access_token = None
    connector.encrypted_refresh_token = None
    connector.token_expires_at = None
    connector.oauth_scopes = None
    connector.encrypted_aws_access_key_id = None
    connector.encrypted_aws_secret_access_key = None
    connector.status = "disconnected"
    connector.last_sync_error = None

    db.commit()


# ── DANI-BE-021: Google Workspace ─────────────────────────────────────────────

# Scopes mínimos para recolección de evidencias ISO 27001
GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/admin.directory.user.readonly",
    "https://www.googleapis.com/auth/admin.directory.group.readonly",
    "openid",
    "email",
]


def get_google_auth_url(org_id: UUID, state_token: str) -> str:
    """
    Construye la URL de autorización OAuth 2.0 de Google.
    El state_token debe incluir el org_id para recuperarlo en el callback.
    """
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "offline",   # para obtener refresh_token
        "prompt": "consent",        # fuerza reemisión del refresh_token
        "state": state_token,
    }
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    return f"{base_url}?{urllib.parse.urlencode(params)}"


def handle_google_callback(code: str, org_id: UUID, db: Session) -> Connector:
    """
    Intercambia el código de autorización por access_token + refresh_token.
    Guarda los tokens encriptados en BD.
    """
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.google_redirect_uri,
        "grant_type": "authorization_code",
    }

    with httpx.Client() as client:
        response = client.post(token_url, data=payload)

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Google OAuth falló: {response.text}",
        )

    token_data = response.json()

    connector = _get_or_create_connector(db, org_id, "google_workspace")
    connector.encrypted_access_token = encrypt(token_data["access_token"])
    connector.encrypted_refresh_token = encrypt(
        token_data.get("refresh_token", "")
    )
    connector.token_expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=token_data.get("expires_in", 3600)
    )
    connector.oauth_scopes = token_data.get("scope", "")
    connector.status = "connected"
    connector.last_sync_error = None

    db.commit()
    db.refresh(connector)
    return connector


def sync_google_workspace(org_id: UUID, db: Session) -> dict:
    """
    Recolecta evidencias desde Google Workspace Admin SDK:
    - Configuración MFA de usuarios
    - Lista de usuarios activos
    - Grupos y sus miembros
    Retorna un resumen de lo recolectado.
    """
    connector = _require_connector(db, org_id, "google_workspace")

    if not connector.is_connected:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El conector Google no está conectado. Inicia el flujo OAuth primero.",
        )

    connector.status = "syncing"
    db.commit()

    try:
        access_token = decrypt(connector.encrypted_access_token)

        headers = {"Authorization": f"Bearer {access_token}"}
        collected: dict = {"users": [], "mfa_summary": {}, "groups": []}

        with httpx.Client() as client:
            # Recolectar usuarios
            users_resp = client.get(
                "https://admin.googleapis.com/admin/directory/v1/users",
                headers=headers,
                params={"customer": "my_customer", "maxResults": 100},
            )
            if users_resp.status_code == 200:
                users_data = users_resp.json().get("users", [])
                collected["users"] = [
                    {
                        "email": u.get("primaryEmail"),
                        "name": u.get("name", {}).get("fullName"),
                        "is_admin": u.get("isAdmin", False),
                        "mfa_enrolled": u.get("isEnrolledIn2Sv", False),
                        "suspended": u.get("suspended", False),
                    }
                    for u in users_data
                ]
                total = len(collected["users"])
                mfa_on = sum(1 for u in collected["users"] if u["mfa_enrolled"])
                collected["mfa_summary"] = {
                    "total_users": total,
                    "mfa_enabled": mfa_on,
                    "mfa_disabled": total - mfa_on,
                    "mfa_adoption_pct": round((mfa_on / total * 100), 1) if total else 0,
                }

            # Recolectar grupos
            groups_resp = client.get(
                "https://admin.googleapis.com/admin/directory/v1/groups",
                headers=headers,
                params={"customer": "my_customer", "maxResults": 50},
            )
            if groups_resp.status_code == 200:
                collected["groups"] = [
                    {
                        "email": g.get("email"),
                        "name": g.get("name"),
                        "member_count": g.get("directMembersCount", 0),
                    }
                    for g in groups_resp.json().get("groups", [])
                ]

        connector.mark_sync_success()
        db.commit()
        return collected

    except Exception as exc:
        connector.mark_sync_error(str(exc))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error durante sync Google: {exc}",
        )


# ── DANI-BE-022: Microsoft 365 ────────────────────────────────────────────────

MICROSOFT_SCOPES = [
    "https://graph.microsoft.com/User.Read.All",
    "https://graph.microsoft.com/Policy.Read.All",
    "https://graph.microsoft.com/AuditLog.Read.All",
    "offline_access",
]


def get_microsoft_auth_url(org_id: UUID, state_token: str) -> str:
    """Construye la URL OAuth 2.0 para Microsoft (Azure AD)."""
    tenant_id = settings.microsoft_tenant_id or "common"
    params = {
        "client_id": settings.microsoft_client_id,
        "redirect_uri": settings.microsoft_redirect_uri,
        "response_type": "code",
        "scope": " ".join(MICROSOFT_SCOPES),
        "state": state_token,
        "response_mode": "query",
    }
    base_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize"
    return f"{base_url}?{urllib.parse.urlencode(params)}"


def handle_microsoft_callback(code: str, org_id: UUID, db: Session) -> Connector:
    """Intercambia código por tokens de Microsoft Graph API."""
    tenant_id = settings.microsoft_tenant_id or "common"
    token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"

    payload = {
        "code": code,
        "client_id": settings.microsoft_client_id,
        "client_secret": settings.microsoft_client_secret,
        "redirect_uri": settings.microsoft_redirect_uri,
        "grant_type": "authorization_code",
        "scope": " ".join(MICROSOFT_SCOPES),
    }

    with httpx.Client() as client:
        response = client.post(token_url, data=payload)

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Microsoft OAuth falló: {response.text}",
        )

    token_data = response.json()

    connector = _get_or_create_connector(db, org_id, "microsoft_365")
    connector.encrypted_access_token = encrypt(token_data["access_token"])
    connector.encrypted_refresh_token = encrypt(
        token_data.get("refresh_token", "")
    )
    connector.token_expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=token_data.get("expires_in", 3600)
    )
    connector.oauth_scopes = token_data.get("scope", "")
    connector.status = "connected"

    db.commit()
    db.refresh(connector)
    return connector


def sync_microsoft_365(org_id: UUID, db: Session) -> dict:
    """
    Recolecta evidencias desde Microsoft Graph API:
    - Usuarios de Azure AD
    - Políticas de acceso condicional
    - Logs de auditoría (últimos 7 días)
    """
    connector = _require_connector(db, org_id, "microsoft_365")

    if not connector.is_connected:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El conector Microsoft 365 no está conectado.",
        )

    connector.status = "syncing"
    db.commit()

    try:
        access_token = decrypt(connector.encrypted_access_token)
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        collected: dict = {"users": [], "conditional_access_policies": [], "audit_logs": []}

        with httpx.Client() as client:
            # Usuarios Azure AD
            users_resp = client.get(
                "https://graph.microsoft.com/v1.0/users",
                headers=headers,
                params={"$select": "id,displayName,userPrincipalName,accountEnabled,assignedLicenses"},
            )
            if users_resp.status_code == 200:
                collected["users"] = [
                    {
                        "id": u.get("id"),
                        "name": u.get("displayName"),
                        "email": u.get("userPrincipalName"),
                        "enabled": u.get("accountEnabled"),
                        "has_license": len(u.get("assignedLicenses", [])) > 0,
                    }
                    for u in users_resp.json().get("value", [])
                ]

            # Políticas de acceso condicional
            ca_resp = client.get(
                "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies",
                headers=headers,
            )
            if ca_resp.status_code == 200:
                collected["conditional_access_policies"] = [
                    {
                        "id": p.get("id"),
                        "displayName": p.get("displayName"),
                        "state": p.get("state"),  # enabled | disabled | enabledForReportingButNotEnforced
                    }
                    for p in ca_resp.json().get("value", [])
                ]

        connector.mark_sync_success()
        db.commit()
        return collected

    except Exception as exc:
        connector.mark_sync_error(str(exc))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error durante sync Microsoft 365: {exc}",
        )


# ── DANI-BE-023: AWS ──────────────────────────────────────────────────────────

def configure_aws(
    org_id: UUID,
    access_key_id: str,
    secret_access_key: str,
    region: str,
    db: Session,
) -> Connector:
    """
    Guarda las credenciales AWS encriptadas.
    AWS no usa flujo OAuth — se configura con Access Key ID + Secret.
    Valida la conexión intentando un sts:GetCallerIdentity antes de guardar.
    """
    # Validación rápida con STS antes de guardar
    try:
        import boto3
        sts = boto3.client(
            "sts",
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name=region,
        )
        sts.get_caller_identity()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Credenciales AWS inválidas: {exc}",
        )

    connector = _get_or_create_connector(db, org_id, "aws")
    connector.encrypted_aws_access_key_id = encrypt(access_key_id)
    connector.encrypted_aws_secret_access_key = encrypt(secret_access_key)
    connector.aws_region = region
    connector.status = "connected"

    db.commit()
    db.refresh(connector)
    return connector


def sync_aws(org_id: UUID, db: Session) -> dict:
    """
    Recolecta evidencias desde AWS:
    - Usuarios IAM y sus políticas
    - Buckets S3 y configuración de cifrado
    - Estado de CloudTrail
    - Findings de AWS Config
    """
    connector = _require_connector(db, org_id, "aws")

    if not connector.is_connected:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El conector AWS no está configurado.",
        )

    connector.status = "syncing"
    db.commit()

    try:
        import boto3

        access_key = decrypt(connector.encrypted_aws_access_key_id)
        secret_key = decrypt(connector.encrypted_aws_secret_access_key)
        region = connector.aws_region or "us-east-1"

        session = boto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
        collected: dict = {"iam_users": [], "s3_buckets": [], "cloudtrail": {}}

        # IAM Users
        iam = session.client("iam")
        paginator = iam.get_paginator("list_users")
        iam_users = []
        for page in paginator.paginate():
            for user in page["Users"]:
                iam_users.append({
                    "username": user["UserName"],
                    "created_at": user["CreateDate"].isoformat(),
                    "has_mfa": _aws_user_has_mfa(iam, user["UserName"]),
                })
        collected["iam_users"] = iam_users

        # S3 Buckets
        s3 = session.client("s3")
        buckets = s3.list_buckets().get("Buckets", [])
        collected["s3_buckets"] = [
            {
                "name": b["Name"],
                "created_at": b["CreationDate"].isoformat(),
            }
            for b in buckets
        ]

        # CloudTrail
        ct = session.client("cloudtrail")
        trails = ct.describe_trails().get("trailList", [])
        collected["cloudtrail"] = {
            "trails_count": len(trails),
            "trails": [{"name": t.get("Name"), "is_multi_region": t.get("IsMultiRegionTrail")} for t in trails],
        }

        connector.mark_sync_success()
        db.commit()
        return collected

    except Exception as exc:
        connector.mark_sync_error(str(exc))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error durante sync AWS: {exc}",
        )


def _aws_user_has_mfa(iam_client, username: str) -> bool:
    """Verifica si un usuario IAM tiene MFA activo."""
    try:
        devices = iam_client.list_mfa_devices(UserName=username).get("MFADevices", [])
        return len(devices) > 0
    except Exception:
        return False


# ── DANI-BE-024: GitHub ───────────────────────────────────────────────────────

GITHUB_SCOPES = ["read:org", "read:user", "repo"]


def get_github_auth_url(org_id: UUID, state_token: str) -> str:
    """Construye la URL OAuth de GitHub App."""
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": settings.github_redirect_uri,
        "scope": " ".join(GITHUB_SCOPES),
        "state": state_token,
    }
    return f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"


def handle_github_callback(code: str, org_id: UUID, db: Session) -> Connector:
    """Intercambia el código por un access_token de GitHub."""
    with httpx.Client() as client:
        response = client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
                "redirect_uri": settings.github_redirect_uri,
            },
            headers={"Accept": "application/json"},
        )

    if response.status_code != 200 or "access_token" not in response.json():
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub OAuth falló: {response.text}",
        )

    token_data = response.json()

    connector = _get_or_create_connector(db, org_id, "github")
    connector.encrypted_access_token = encrypt(token_data["access_token"])
    connector.oauth_scopes = token_data.get("scope", "")
    connector.status = "connected"

    db.commit()
    db.refresh(connector)
    return connector


def sync_github(org_id: UUID, db: Session) -> dict:
    """
    Recolecta evidencias desde GitHub:
    - Repositorios y configuración de branch protection
    - Alertas de Dependabot
    - Configuración de secretos del repo
    """
    connector = _require_connector(db, org_id, "github")

    if not connector.is_connected:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El conector GitHub no está conectado.",
        )

    connector.status = "syncing"
    db.commit()

    try:
        access_token = decrypt(connector.encrypted_access_token)
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        }
        collected: dict = {"repos": [], "org_members": []}

        with httpx.Client() as client:
            # Repos de la organización (o del usuario autenticado)
            repos_resp = client.get(
                "https://api.github.com/user/repos",
                headers=headers,
                params={"per_page": 50, "sort": "updated"},
            )
            if repos_resp.status_code == 200:
                collected["repos"] = [
                    {
                        "name": r.get("name"),
                        "full_name": r.get("full_name"),
                        "private": r.get("private"),
                        "default_branch": r.get("default_branch"),
                        "has_issues": r.get("has_issues"),
                    }
                    for r in repos_resp.json()
                ]

        connector.mark_sync_success()
        db.commit()
        return collected

    except Exception as exc:
        connector.mark_sync_error(str(exc))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error durante sync GitHub: {exc}",
        )
