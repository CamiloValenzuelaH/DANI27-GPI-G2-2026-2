from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints.auth import router

app = FastAPI(
    title="DANI27 API -Alloxentric"
)

origins = [
    # URLS que permitira
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix='/api/v1', tags=['Authenticate'])