<<<<<<< HEAD
import base64
import os
from functools import lru_cache

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings

_NONCE_SIZE = 12


@lru_cache(maxsize=1)
def _master_key() -> bytes:
    key_text = settings.encryption_key.strip()
    if not key_text:
        raise ValueError("ENCRYPTION_KEY is required")

    try:
        key = base64.b64decode(key_text)
    except Exception as exc:
        raise ValueError("ENCRYPTION_KEY must be base64-encoded") from exc

    if len(key) != 32:
        raise ValueError("ENCRYPTION_KEY must decode to 32 bytes")

    return key


def encrypt(data: str) -> str:
    nonce = os.urandom(_NONCE_SIZE)
    ciphertext = AESGCM(_master_key()).encrypt(nonce, data.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("ascii")


def decrypt(data: str) -> str:
    payload = base64.b64decode(data)
    nonce = payload[:_NONCE_SIZE]
    ciphertext = payload[_NONCE_SIZE:]
    plaintext = AESGCM(_master_key()).decrypt(nonce, ciphertext, None)
=======
import base64
import os
from functools import lru_cache

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings

_NONCE_SIZE = 12


@lru_cache(maxsize=1)
def _master_key() -> bytes:
    key_text = settings.encryption_key.strip()
    if not key_text:
        raise ValueError("ENCRYPTION_KEY is required")

    try:
        key = base64.b64decode(key_text)
    except Exception as exc:
        raise ValueError("ENCRYPTION_KEY must be base64-encoded") from exc

    if len(key) != 32:
        raise ValueError("ENCRYPTION_KEY must decode to 32 bytes")

    return key


def encrypt(data: str) -> str:
    nonce = os.urandom(_NONCE_SIZE)
    ciphertext = AESGCM(_master_key()).encrypt(nonce, data.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("ascii")


def decrypt(data: str) -> str:
    payload = base64.b64decode(data)
    nonce = payload[:_NONCE_SIZE]
    ciphertext = payload[_NONCE_SIZE:]
    plaintext = AESGCM(_master_key()).decrypt(nonce, ciphertext, None)
>>>>>>> Chat-bot
    return plaintext.decode("utf-8")