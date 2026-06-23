from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.dependencies import get_current_user
from app.workers.gemini_service import generate_embedding
from app.workers.validation_tasks import get_top_iso_chunks

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str


class SearchResult(BaseModel):
    id: str
    clause_ref: str | None = None
    title: str | None = None
    content: str | None = None
    relevance_score: float


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]


@router.post("", response_model=SearchResponse)
async def search_iso_chunks_endpoint(
    payload: SearchRequest,
    current_user=Depends(get_current_user),
):
    embedding = await generate_embedding(payload.query)
    results = await get_top_iso_chunks(embedding, limit=10)

    return SearchResponse(query=payload.query, results=results)
