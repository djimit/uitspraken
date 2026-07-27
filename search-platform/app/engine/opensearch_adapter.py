import os

from opensearchpy import AsyncOpenSearch

from app.engine.port import IndexTemplate, SearchEnginePort, SearchHit, SearchResult


class OpenSearchAdapter(SearchEnginePort):
    def __init__(self, client: AsyncOpenSearch):
        self._client = client

    @classmethod
    def from_env(cls) -> "OpenSearchAdapter":
        url = os.environ.get("OPENSEARCH_URL", "https://localhost:9200")
        user = os.environ.get("OPENSEARCH_USER", "admin")
        password = os.environ.get("OPENSEARCH_PASSWORD", "Admin123!ChangeMe")
        verify = os.environ.get("OPENSEARCH_VERIFY_CERTS", "false").lower() == "true"
        client = AsyncOpenSearch(
            hosts=[url],
            http_auth=(user, password),
            use_ssl=True,
            verify_certs=verify,
        )
        return cls(client)

    async def create_index(self, name: str, template: IndexTemplate) -> None:
        body: dict = {"mappings": template.mappings}
        if template.settings:
            body["settings"] = template.settings
        await self._client.indices.create(index=name, body=body)

    async def delete_index(self, name: str) -> None:
        await self._client.indices.delete(index=name, ignore=[404])

    async def index_document(self, index: str, doc_id: str, document: dict) -> None:
        await self._client.index(index=index, id=doc_id, body=document, refresh="wait_for")

    async def delete_document(self, index: str, doc_id: str) -> None:
        await self._client.delete(index=index, id=doc_id, ignore=[404], refresh="wait_for")

    async def search(self, index: str, query: dict) -> SearchResult:
        resp = await self._client.search(index=index, body=query)
        hits = [
            SearchHit(
                id=h["_id"],
                score=h.get("_score", 0.0),
                source=h.get("_source", {}),
                highlights=h.get("highlight"),
            )
            for h in resp["hits"]["hits"]
        ]
        return SearchResult(
            hits=hits,
            total=resp["hits"]["total"]["value"],
            took_ms=resp["took"],
            facets=resp.get("aggregations"),
        )

    async def explain(self, index: str, doc_id: str, query: dict) -> dict:
        resp = await self._client.explain(index=index, id=doc_id, body=query)
        return dict(resp)

    async def bulk_index(self, index: str, documents: list[tuple[str, dict]]) -> None:
        from opensearchpy.helpers import async_bulk

        actions = [
            {"_op_type": "index", "_index": index, "_id": doc_id, "_source": doc}
            for doc_id, doc in documents
        ]
        await async_bulk(self._client, actions, refresh="wait_for")

    async def delete_by_query(self, index: str, query: dict) -> int:
        resp = await self._client.delete_by_query(index=index, body={"query": query}, refresh=True)
        return resp.get("deleted", 0)
