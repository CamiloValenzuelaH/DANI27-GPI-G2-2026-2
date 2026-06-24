from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.api.two_factor import router as two_factor_router
from app.api.v1 import evidences, risks
from app.api import validate
from app.api.notifications import router as notifications_router
from app.core.config import settings
from app.core.middleware import AuditMiddleware
from app.core.security import decode_access_token
from app.core.ws_manager import websocket_manager

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
app.include_router(two_factor_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(risks.router, prefix="/api")
app.include_router(validate.router, prefix="/api")
app.include_router(evidences.router, prefix="/api")
app.include_router(validate.router, prefix="/api/v1/validate", tags=["validate"])

# Registrar middleware de auditoría (registra cada petición en tabla separada)
app.add_middleware(AuditMiddleware)

def _get_ws_user_from_token(token: str) -> str | None:
    try:
        payload = decode_access_token(token)
        if payload.get("purpose"):
            return None
        return payload.get("sub")
    except ValueError:
        return None


@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    token = None
    authorization = websocket.headers.get("authorization")
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    else:
        token = websocket.query_params.get("token")

    user_id = _get_ws_user_from_token(token) if token else None
    if not user_id:
        await websocket.close(code=4401)
        return

    try:
        await websocket_manager.connect(user_id, websocket)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(user_id, websocket)
    except Exception:
        websocket_manager.disconnect(user_id, websocket)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "app": settings.app_name}