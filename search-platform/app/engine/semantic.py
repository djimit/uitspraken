import os
from dataclasses import dataclass

from app.engine.port import SearchHit


@dataclass
class SemanticConfig:
    enabled: bool = False
    embedding_field: str = "embedding"
    embedding_dim: int = 768
    k: int = 10
    num_candidates: int = 50


def build_knn_query(query_vector: list[float], config: SemanticConfig) -> dict:
    return {
        "knn": {
            config.embedding_field: {
                "vector": query_vector,
                "k": config.k,
                "num_candidates": config.num_candidates,
            }
        }
    }


def build_hybrid_query(text_query: dict, query_vector: list[float], config: SemanticConfig) -> dict:
    return {
        "query": text_query,
        "knn": {
            config.embedding_field: {
                "vector": query_vector,
                "k": config.k,
                "num_candidates": config.num_candidates,
            }
        },
        "rank": {"rrf": {"window_size": 50, "rank_constant": 20}},
    }


def combine_results_rrf(
    text_hits: list[SearchHit], knn_hits: list[SearchHit], k: int = 20
) -> list[SearchHit]:
    scores: dict[str, float] = {}
    for rank, hit in enumerate(text_hits):
        scores[hit.id] = scores.get(hit.id, 0.0) + 1.0 / (k + rank + 1)
    for rank, hit in enumerate(knn_hits):
        scores[hit.id] = scores.get(hit.id, 0.0) + 1.0 / (k + rank + 1)
    all_hits = {h.id: h for h in text_hits + knn_hits}
    sorted_ids = sorted(scores, key=lambda x: scores[x], reverse=True)
    return [all_hits[hid] for hid in sorted_ids if hid in all_hits]


def is_semantic_enabled(context_name: str = "") -> bool:
    return os.environ.get(f"SEMANTIC_ENABLED_{context_name.upper()}", "").lower() == "true"
