from app.index.context_registry import ContextRegistry
from app.index.templates import build_index_template


class TestContextRegistry:
    def test_load_from_directory(self):
        registry = ContextRegistry.load_from_directory("contexts")
        assert len(registry.contexts) >= 1
        names = registry.list_names()
        assert any("openbaar" in n for n in names)

    def test_get_context(self):
        registry = ContextRegistry.load_from_directory("contexts")
        ctx = registry.get("uitspraken-openbaar")
        assert ctx is not None
        assert ctx.profile == "standaard"

    def test_context_has_classification(self):
        registry = ContextRegistry.load_from_directory("contexts")
        ctx = registry.get("uitspraken-openbaar")
        assert ctx.classification.B == 2
        assert ctx.classification.I == 2

    def test_context_has_sources(self):
        registry = ContextRegistry.load_from_directory("contexts")
        ctx = registry.get("uitspraken-openbaar")
        assert len(ctx.sources) >= 1
        assert ctx.sources[0].connector == "mock_sql"


class TestIndexTemplates:
    def test_build_template(self):
        registry = ContextRegistry.load_from_directory("contexts")
        ctx = registry.get("uitspraken-openbaar")
        template = build_index_template(ctx)
        assert template.name == "uitspraken-openbaar"
        assert "properties" in template.mappings
        assert template.settings is not None
