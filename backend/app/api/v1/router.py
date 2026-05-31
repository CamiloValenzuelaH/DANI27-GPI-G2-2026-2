from fastapi import APIRouter
from app.api.v1 import auth, users, roles, assets, audit, dashboard, assessment, audit_trail, evidences, threats, vulnerabilities, risks

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(assets.router)
api_router.include_router(audit.router)
api_router.include_router(audit_trail.router)
api_router.include_router(dashboard.router)
api_router.include_router(assessment.router)
api_router.include_router(evidences.router)
api_router.include_router(threats.router)
api_router.include_router(vulnerabilities.router)
api_router.include_router(risks.router)