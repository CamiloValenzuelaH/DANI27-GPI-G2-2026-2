from fastapi import APIRouter
from app.api.v1 import auth, users, roles, assets, audit, dashboard

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(assets.router)
api_router.include_router(audit.router)
api_router.include_router(dashboard.router)