import pytest
from fastapi.testclient import TestClient

from app.api.admin import set_registry
from app.index.context_registry import ContextRegistry
from app.main import app


@pytest.fixture
def client():
    registry = ContextRegistry.load_from_directory("contexts")
    set_registry(registry)
    return TestClient(app)


class TestHealth:
    def test_healthz(self, client):
        r = client.get("/healthz")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_readyz(self, client):
        r = client.get("/readyz")
        assert r.status_code == 200

    def test_metrics(self, client):
        r = client.get("/metrics")
        assert r.status_code == 200


class TestAdmin:
    def test_list_contexts(self, client):
        r = client.get("/v1/admin/contexts")
        assert r.status_code == 200
        assert "contexts" in r.json()

    def test_get_context(self, client):
        r = client.get("/v1/admin/contexts/uitspraken-openbaar")
        assert r.status_code == 200
        assert r.json()["name"] == "uitspraken-openbaar"

    def test_get_unknown_context(self, client):
        r = client.get("/v1/admin/contexts/nonexistent")
        assert r.status_code == 404


class TestSearch:
    def test_search_no_engine(self, client):
        r = client.post("/v1/contexts/uitspraken-openbaar/search", json={"query": "test"})
        assert r.status_code == 503

    def test_ingest_no_engine(self, client):
        r = client.post(
            "/v1/contexts/uitspraken-openbaar/documents", json={"id": "test", "title": "test"}
        )
        assert r.status_code == 503
