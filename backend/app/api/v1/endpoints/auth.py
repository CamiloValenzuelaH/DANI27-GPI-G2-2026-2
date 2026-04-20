from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import LoginRequest, TokenResponse
from app.core.security import create_access_token, get_password_hash, verify_password

router = APIRouter()

# Simulacion de usuario en la base de datos
MOCK_USER = {
    "email": "admin@ejemplo.com",
    "hashed_password": get_password_hash("password1234")
}

@router.post('/login', response_model=TokenResponse)
async def login(user_data: LoginRequest):
    # Verificar si existe el usuario
    if user_data.email != MOCK_USER["email"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect access credentials"
        )
        
    # Verificar la contraseña
    if not verify_password(user_data.password, MOCK_USER["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect access credentials"
        )
        
    access_token = create_access_token(subject=user_data.email)
    
    return {
        "access_token": access_token, 
        "token_type": "bearer"
    }