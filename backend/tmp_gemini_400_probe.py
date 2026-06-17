<<<<<<< HEAD
import asyncio
import httpx
from app.core.config import settings

async def probe():
    api_base = "https://generativelanguage.googleapis.com/v1"
    model = settings.gemini_validation_model.removeprefix("models/")
    url = f"{api_base}/models/{model}:generateContent?key={settings.gemini_api_key}"

    # Payload intencionalmente inválido: maxOutputTokens como string
    payload = {
        "contents": [{"parts": [{"text": "Prueba breve para provocar 400"}]}],
        "generationConfig": {
            "temperature": 0.1,
            "topP": 0.8,
            "maxOutputTokens": "INVALID"
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            r = await client.post(url, json=payload)
            print('STATUS', r.status_code)
            print('RESPONSE TEXT:\n', r.text[:8000])
        except Exception as e:
            print('EXCEPTION', e)

if __name__ == '__main__':
    asyncio.run(probe())
=======
import asyncio
import httpx
from app.core.config import settings

async def probe():
    api_base = "https://generativelanguage.googleapis.com/v1"
    model = settings.gemini_validation_model.removeprefix("models/")
    url = f"{api_base}/models/{model}:generateContent?key={settings.gemini_api_key}"

    # Payload intencionalmente inválido: maxOutputTokens como string
    payload = {
        "contents": [{"parts": [{"text": "Prueba breve para provocar 400"}]}],
        "generationConfig": {
            "temperature": 0.1,
            "topP": 0.8,
            "maxOutputTokens": "INVALID"
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            r = await client.post(url, json=payload)
            print('STATUS', r.status_code)
            print('RESPONSE TEXT:\n', r.text[:8000])
        except Exception as e:
            print('EXCEPTION', e)

if __name__ == '__main__':
    asyncio.run(probe())
>>>>>>> Chat-bot
