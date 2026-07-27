from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class SearchHit:
    id: str
    score: float
    source: dict
    highlights: dict | None = None


@dataclass
class SearchResult:
    hits: list[SearchHit]
    total: int
    took_ms: int
    facets: dict | None = None


@dataclass
class IndexTemplate:
    name: str
    mappings: dict
    settings: dict | None = None


class SearchEnginePort(ABC):
    @abstractmethod
    async def create_index(self, name: str, template: IndexTemplate) -> None: ...

    @abstractmethod
    async def delete_index(self, name: str) -> None: ...

    @abstractmethod
    async def index_document(self, index: str, doc_id: str, document: dict) -> None: ...

    @abstractmethod
    async def delete_document(self, index: str, doc_id: str) -> None: ...

    @abstractmethod
    async def search(self, index: str, query: dict) -> SearchResult: ...

    @abstractmethod
    async def explain(self, index: str, doc_id: str, query: dict) -> dict: ...

    @abstractmethod
    async def bulk_index(
        self, index: str, documents: list[tuple[str, dict]]
    ) -> None: ...

    @abstractmethod
    async def delete_by_query(self, index: str, query: dict) -> int: ...
