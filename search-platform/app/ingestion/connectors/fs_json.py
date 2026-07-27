import json
import pathlib

from app.ingestion.connectors import DataSourceConnector, register_connector


@register_connector("fs_json")
class FsJsonConnector(DataSourceConnector):
    def __init__(self, path: str | None = None):
        self._path = path

    async def fetch(self, **kwargs) -> list[dict]:
        p = pathlib.Path(self._path) if self._path else pathlib.Path(kwargs.get("path", "."))
        if p.is_file():
            return json.loads(p.read_text())
        if p.is_dir():
            results = []
            for f in p.glob("*.json"):
                results.extend(json.loads(f.read_text()))
            return results
        return []
