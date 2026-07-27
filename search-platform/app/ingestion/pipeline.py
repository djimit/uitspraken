from app.index.context_registry import ContextConfig
from app.ingestion.connectors import get_connector


async def ingest_context(ctx: ContextConfig) -> dict:
    all_docs: dict[str, dict] = {}
    for source in ctx.sources:
        connector = get_connector(source.connector)
        docs = await connector.fetch()
        for doc in docs:
            key = doc.get(source.join_key)
            if key:
                if key not in all_docs:
                    all_docs[key] = {source.join_key: doc.get(source.join_key)}
                all_docs[key].update(doc)
                all_docs[key]["source_system"] = source.id
    return {"context": ctx.name, "documents": len(all_docs), "docs": list(all_docs.values())}
