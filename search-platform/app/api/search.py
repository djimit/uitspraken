from fastapi import APIRouter, Depends, Header, HTTPException

from app.api.models import SearchHitResponse, SearchRequest, SearchResponse
from app.engine.port import SearchEnginePort
from app.engine.query_builder import SearchQuery, build_search_query
from app.observability.audit import log_search_request
from app.security.authz import AuthContext, decode_token
from app.security.masking import sanitize_query_for_log

router = APIRouter(prefix="/v1/contexts")

_engine: SearchEnginePort | None = None
_jwt_secret: str = "dev-secret-change-in-production"


def get_engine() -> SearchEnginePort:
    if _engine is None:
        raise HTTPException(status_code=503, detail="Search engine not initialized")
    return _engine


def set_engine(engine: SearchEnginePort) -> None:
    global _engine
    _engine = engine


def get_auth(authorization: str | None = Header(None)) -> AuthContext | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ")
    try:
        return decode_token(token, _jwt_secret)
    except Exception:
        return None


@router.post("/{ctx}/search", response_model=SearchResponse)
async def search(
    ctx: str,
    req: SearchRequest,
    engine: SearchEnginePort = Depends(get_engine),
    auth: AuthContext | None = Depends(get_auth),
):
    sq = SearchQuery(
        query=req.query,
        mode=req.mode,
        filters=list(req.filters),
        sort=req.sort,
        facets=req.facets,
        page=req.page,
        size=req.size,
    )
    result = await engine.search(ctx, build_search_query(sq))
    log_search_request(
        ctx,
        auth.sub if auth else "anonymous",
        sanitize_query_for_log(req.query),
        result.total,
        result.took_ms,
    )
    return SearchResponse(
        hits=[
            SearchHitResponse(id=h.id, score=h.score, source=h.source, highlights=h.highlights)
            for h in result.hits
        ],
        total=result.total,
        took_ms=result.took_ms,
        facets=result.facets,
    )


@router.post("/{ctx}/documents")
async def ingest_document(
    ctx: str,
    req: dict,
    engine: SearchEnginePort = Depends(get_engine),
):
    doc_id = req.get("id") or req.get("ecli")
    if not doc_id:
        raise HTTPException(status_code=400, detail="Document must have 'id' or 'ecli'")
    document = req.get("document", {k: v for k, v in req.items() if k not in ("id", "ecli")})
    await engine.index_document(ctx, doc_id, document)
    return {"indexed": doc_id}


@router.delete("/{ctx}/documents/{doc_id}")
async def delete_document(ctx: str, doc_id: str, engine: SearchEnginePort = Depends(get_engine)):
    await engine.delete_document(ctx, doc_id)
    return {"deleted": doc_id}
