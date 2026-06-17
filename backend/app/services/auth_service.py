<<<<<<< HEAD
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.organization import Organization
from app.models.plan import Plan
from app.models.role import Role
from app.models.user_role import UserRole
from app.models.refresh_token import RefreshToken
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
)
from app.core.config import settings


# ── Helpers ───────────────────────────────────────────────

def _get_default_plan(db: Session) -> Plan:
    plan = db.query(Plan).filter(Plan.slug == "starter").first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Default plan not configured. Run the seeder",
        )
    return plan


def _create_system_roles(db: Session, organization: Organization) -> Role:
    system_roles = ["owner", "admin", "auditor", "viewer", "employee"]
    owner_role = None

    for role_name in system_roles:
        role = Role(
            organization_id=organization.id,
            name=role_name,
            description=f"System rol: {role_name}",
            is_system_role=True,
        )
        db.add(role)
        if role_name == "owner":
            owner_role = role

    return owner_role


def _build_tokens(db: Session, user: User) -> TokenResponse:
    access_token = create_access_token(
        subject=str(user.id),
        extra={
            "org_id": str(user.organization_id),
            "email": user.email,
        },
    )

    raw_refresh = generate_refresh_token()
    token_hash = hash_refresh_token(raw_refresh)

    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        ),
        is_revoked=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(db_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
    )


# ── Casos de uso ──────────────────────────────────────────

def register(data: RegisterRequest, db: Session) -> tuple[TokenResponse, User]:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email address already exists",
        )

    if db.query(Organization).filter(Organization.slug == data.organization_slug).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The organization slug is already in use",
        )

    plan = _get_default_plan(db)

    org = Organization(
        plan_id=plan.id,
        name=data.organization_name,
        slug=data.organization_slug,
        status="active",
    )
    db.add(org)
    db.flush()  # necesitamos org.id antes de continuar

    owner_role = _create_system_roles(db, org)
    db.flush()  # necesitamos owner_role.id

    user = User(
        organization_id=org.id,
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        is_active=True,
        is_superadmin=False,
    )
    db.add(user)
    db.flush()  # necesitamos user.id

    db.add(UserRole(user_id=user.id, role_id=owner_role.id))

    tokens = _build_tokens(db, user)
    db.commit()
    db.refresh(user)

    return tokens, user


def login(data: LoginRequest, db: Session) -> tuple[TokenResponse, User]:
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive account",
        )

    user.last_login_at = datetime.now(timezone.utc)
    tokens = _build_tokens(db, user)
    db.commit()
    db.refresh(user)

    return tokens, user


def refresh(raw_token: str, db: Session) -> TokenResponse:
    token_hash = hash_refresh_token(raw_token)

    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.is_revoked == False,
    ).first()

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalid or revoked",
        )

    if db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    # Rotación: revocar el token actual y emitir uno nuevo
    db_token.is_revoked = True
    db.flush()

    user = db.query(User).filter(User.id == db_token.user_id).first()
    tokens = _build_tokens(db, user)
    db.commit()

    return tokens


def logout(raw_token: str, db: Session) -> None:
    token_hash = hash_refresh_token(raw_token)
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash
    ).first()

    if db_token:
        db_token.is_revoked = True
=======
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.organization import Organization
from app.models.plan import Plan
from app.models.role import Role
from app.models.user_role import UserRole
from app.models.refresh_token import RefreshToken
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    TwoFactorChallengeResponse,
    UserResponse,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
)
from app.core.config import settings


# ── Helpers ───────────────────────────────────────────────

def _get_default_plan(db: Session) -> Plan:
    plan = db.query(Plan).filter(Plan.slug == "starter").first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Default plan not configured. Run the seeder",
        )
    return plan


def _create_system_roles(db: Session, organization: Organization) -> Role:
    system_roles = ["owner", "admin", "auditor", "viewer", "employee"]
    owner_role = None

    for role_name in system_roles:
        role = Role(
            organization_id=organization.id,
            name=role_name,
            description=f"System rol: {role_name}",
            is_system_role=True,
        )
        db.add(role)
        if role_name == "owner":
            owner_role = role

    return owner_role


def _build_tokens(db: Session, user: User) -> TokenResponse:
    access_token = create_access_token(
        subject=str(user.id),
        extra={
            "org_id": str(user.organization_id),
            "email": user.email,
        },
    )

    raw_refresh = generate_refresh_token()
    token_hash = hash_refresh_token(raw_refresh)

    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        ),
        is_revoked=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(db_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
    )


def issue_tokens(db: Session, user: User) -> TokenResponse:
    return _build_tokens(db, user)


# ── Casos de uso ──────────────────────────────────────────

def register(data: RegisterRequest, db: Session) -> tuple[TokenResponse, User]:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email address already exists",
        )

    if db.query(Organization).filter(Organization.slug == data.organization_slug).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The organization slug is already in use",
        )

    plan = _get_default_plan(db)

    org = Organization(
        plan_id=plan.id,
        name=data.organization_name,
        slug=data.organization_slug,
        status="active",
    )
    db.add(org)
    db.flush()  # necesitamos org.id antes de continuar

    owner_role = _create_system_roles(db, org)
    db.flush()  # necesitamos owner_role.id

    user = User(
        organization_id=org.id,
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        is_active=True,
        is_superadmin=False,
    )
    db.add(user)
    db.flush()  # necesitamos user.id

    db.add(UserRole(user_id=user.id, role_id=owner_role.id))

    tokens = _build_tokens(db, user)
    db.commit()
    db.refresh(user)

    return tokens, user


def login(data: LoginRequest, db: Session) -> tuple[TokenResponse | TwoFactorChallengeResponse, User]:
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive account",
        )

    if user.two_factor_enabled:
        challenge_token = create_access_token(
            subject=str(user.id),
            extra={
                "purpose": "two_factor_login",
                "email": user.email,
            },
        )
        return TwoFactorChallengeResponse(
            challenge_token=challenge_token,
            user=UserResponse.model_validate(user),
        ), user

    user.last_login_at = datetime.now(timezone.utc)
    tokens = _build_tokens(db, user)
    db.commit()
    db.refresh(user)

    return tokens, user


def refresh(raw_token: str, db: Session) -> TokenResponse:
    token_hash = hash_refresh_token(raw_token)

    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.is_revoked == False,
    ).first()

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalid or revoked",
        )

    if db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    # Rotación: revocar el token actual y emitir uno nuevo
    db_token.is_revoked = True
    db.flush()

    user = db.query(User).filter(User.id == db_token.user_id).first()
    tokens = _build_tokens(db, user)
    db.commit()

    return tokens


def logout(raw_token: str, db: Session) -> None:
    token_hash = hash_refresh_token(raw_token)
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash
    ).first()

    if db_token:
        db_token.is_revoked = True
>>>>>>> Chat-bot
        db.commit()