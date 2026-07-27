from abc import ABC, abstractmethod


class DataSourceConnector(ABC):
    @abstractmethod
    async def fetch(self, **kwargs) -> list[dict]: ...


CONNECTORS: dict[str, type[DataSourceConnector]] = {}


def register_connector(name: str):
    def decorator(cls: type[DataSourceConnector]):
        CONNECTORS[name] = cls
        return cls

    return decorator


def get_connector(name: str) -> DataSourceConnector:
    cls = CONNECTORS.get(name)
    if not cls:
        raise ValueError(f"Unknown connector: {name!r}")
    return cls()
