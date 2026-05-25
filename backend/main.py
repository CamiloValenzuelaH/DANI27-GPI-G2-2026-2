from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.api.v1 import evidences, risks
from app.api import validate
from app.core.config import settings
from app.core.middleware import AuditMiddleware

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(risks.router, prefix="/api")
app.include_router(validate.router, prefix="/api")
app.include_router(evidences.router, prefix="/api")

# Registrar middleware de auditoría (registra cada petición en tabla separada)
app.add_middleware(AuditMiddleware)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "app": settings.app_name}