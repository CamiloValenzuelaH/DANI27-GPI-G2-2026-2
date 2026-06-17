<<<<<<< HEAD
from __future__ import annotations

from functools import lru_cache

import redis.asyncio as redis

from app.core.config import settings


@lru_cache(maxsize=1)
def get_redis_client() -> redis.Redis:
    return redis.from_url(settings.redis_url, decode_responses=True)


async def close_redis_client() -> None:
    client = get_redis_client()
    await client.aclose()
=======
from __future__ import annotations

from functools import lru_cache

import redis.asyncio as redis

from app.core.config import settings


@lru_cache(maxsize=1)
def get_redis_client() -> redis.Redis:
    return redis.from_url(settings.redis_url, decode_responses=True)


async def close_redis_client() -> None:
    client = get_redis_client()
    await client.aclose()
>>>>>>> Chat-bot
