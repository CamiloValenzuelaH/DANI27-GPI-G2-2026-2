from fastapi import APIRouter
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter()

@router.post('/login', response_model=TokenResponse)
async def login(user_data: LoginRequest):
    
    return {
        "access_token": "tu_token_aqui", 
        "token_type": "bearer"
    }