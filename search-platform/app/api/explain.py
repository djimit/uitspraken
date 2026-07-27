from fastapi import APIRouter, Depends, HTTPException

from app.engine.port import SearchEnginePort
from app.engine.query_builder import SearchQuery, build_search_query

router = APIRouter(prefix="/v1/contexts")


def get_engine() -> SearchEnginePort:
    from app.api.search import get_engine as _get_engine

    return _get_engine()


@router.get("/{ctx}/search/explain")
async def explain(
    ctx: str,
    id: str,
    query: str | None = None,
    mode: str = "fulltext",
    engine: SearchEnginePort = Depends(get_engine),
):
    sq = SearchQuery(query=query, mode=mode)
    try:
        explanation = await engine.explain(ctx, id, build_search_query(sq))
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Explain failed: {e}")
    return {"context": ctx, "document_id": id, "explanation": explanation}
