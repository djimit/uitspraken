from app.engine.port import SearchHit
from app.engine.semantic import (
    SemanticConfig,
    build_hybrid_query,
    build_knn_query,
    combine_results_rrf,
)


class TestKNNQuery:
    def test_build_knn_query(self):
        config = SemanticConfig(embedding_field="embedding", k=5)
        q = build_knn_query([0.1, 0.2, 0.3], config)
        assert "knn" in q
        assert q["knn"]["embedding"]["k"] == 5
        assert q["knn"]["embedding"]["vector"] == [0.1, 0.2, 0.3]


class TestHybridQuery:
    def test_build_hybrid_query(self):
        config = SemanticConfig()
        q = build_hybrid_query({"match": {"title": "test"}}, [0.1] * 768, config)
        assert "query" in q
        assert "knn" in q
        assert "rank" in q
        assert q["rank"]["rrf"]["window_size"] == 50


class TestRRF:
    def test_combine_results_rrf(self):
        text_hits = [
            SearchHit(id="a", score=1.0, source={}),
            SearchHit(id="b", score=0.8, source={}),
        ]
        knn_hits = [
            SearchHit(id="b", score=0.9, source={}),
            SearchHit(id="c", score=0.7, source={}),
        ]
        combined = combine_results_rrf(text_hits, knn_hits)
        assert combined[0].id == "b"
        assert len(combined) == 3

    def test_rrf_ranking(self):
        text_hits = [SearchHit(id="x", score=1.0, source={})]
        knn_hits = [SearchHit(id="y", score=1.0, source={})]
        combined = combine_results_rrf(text_hits, knn_hits)
        assert combined[0].id == "x"
        assert combined[1].id == "y"
