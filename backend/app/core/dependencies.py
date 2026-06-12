from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import User
from app.models.organization import Organization

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token without subject",
        )

    if payload.get("purpose"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Temporary authentication token cannot access protected endpoints",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


def get_current_org(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Organization:
    org = db.query(Organization).filter(
        Organization.id == current_user.organization_id
    ).first()
    if not org or org.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization not found or inactive",
        )
    return org


def require_superadmin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super-administrator permissions required",
        )
    return current_user


def require_plan_feature(feature: str):
    """
    Uso:
        @router.get("/ai", dependencies=[Depends(require_plan_feature("has_ai_features"))])
    """
    def checker(org: Organization = Depends(get_current_org)) -> None:
        if not getattr(org.plan, feature, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your plan does not include access to this feature",
            )
    return checker


def require_roles(*allowed_roles: str):
    allowed_names = {role.strip().lower() for role in allowed_roles if role and role.strip()}

    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superadmin:
            return current_user

        role_names = {
            user_role.role.name.lower()
            for user_role in current_user.user_roles
            if user_role.role is not None and user_role.role.name
        }
        if not allowed_names.intersection(role_names):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permisos de rol insuficientes",
            )
        return current_user

    return checker