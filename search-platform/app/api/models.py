from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str | None = None
    mode: str = "fulltext"
    filters: list[dict] = Field(default_factory=list)
    sort: list[dict] = Field(default_factory=list)
    facets: list[str] = Field(default_factory=list)
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)


class SearchHitResponse(BaseModel):
    id: str
    score: float
    source: dict
    highlights: dict | None = None


class SearchResponse(BaseModel):
    hits: list[SearchHitResponse]
    total: int
    took_ms: int
    facets: dict | None = None


class DocumentIngestRequest(BaseModel):
    id: str
    document: dict
