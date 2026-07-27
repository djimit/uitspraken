from app.engine.port import IndexTemplate
from app.index.context_registry import ContextConfig


def build_index_template(ctx: ContextConfig) -> IndexTemplate:
    settings: dict = {
        "index": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "analysis": {"analyzer": {"dutch": {"type": "standard"}}},
        }
    }
    return IndexTemplate(
        name=ctx.name,
        mappings=ctx.mappings,
        settings=settings,
    )
