from app.ingestion.connectors import DataSourceConnector, register_connector


@register_connector("mock_sql")
class MockSqlConnector(DataSourceConnector):
    async def fetch(self, **kwargs) -> list[dict]:
        return [
            {"ecli": "ECLI:NL:RBAMS:2020:000001", "title": "Mock uitspraak 1", "body": "Mock body"},
            {"ecli": "ECLI:NL:RBAMS:2020:000002", "title": "Mock uitspraak 2", "body": "Mock body"},
        ]
