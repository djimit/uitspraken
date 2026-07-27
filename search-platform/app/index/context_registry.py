import pathlib
from dataclasses import dataclass, field

import yaml
from pydantic import BaseModel, Field


class Classification(BaseModel):
    B: int = Field(ge=1, le=3)
    I: int = Field(ge=1, le=3)  # noqa: E741 - BIV-P informatieclassificatie
    V: int = Field(ge=1, le=3)
    P: int = Field(ge=1, le=3)


class SourceConfig(BaseModel):
    id: str
    connector: str
    join_key: str = "ecli"


class DLSConfig(BaseModel):
    field: str
    claim: str


class FLSConfig(BaseModel):
    restricted_fields: list[str] = Field(default_factory=list)
    allow_roles: list[str] = Field(default_factory=list)


class AuthorizationConfig(BaseModel):
    dls: DLSConfig | None = None
    fls: FLSConfig | None = None


class FreshnessConfig(BaseModel):
    mode: str = "scheduled"
    interval: str = "60m"


class SemanticConfig(BaseModel):
    enabled: bool = False


class ContextConfig(BaseModel):
    name: str
    profile: str
    classification: Classification
    purpose: str = ""
    retention_days: int = 3650
    sources: list[SourceConfig] = Field(default_factory=list)
    authorization: AuthorizationConfig = Field(default_factory=AuthorizationConfig)
    synonyms: str | None = None
    freshness: FreshnessConfig = Field(default_factory=FreshnessConfig)
    semantic: SemanticConfig = Field(default_factory=SemanticConfig)
    mappings: dict = Field(default_factory=dict)


PROFILE_DEFAULTS: dict[str, dict] = {
    "standaard": {"classification": {"B": 2, "I": 2, "V": 2, "P": 2}},
    "beveiligde": {"classification": {"B": 3, "I": 3, "V": 3, "P": 3}},
    "semantische": {"classification": {"B": 2, "I": 2, "V": 2, "P": 2}},
}


@dataclass
class ContextRegistry:
    contexts: dict[str, ContextConfig] = field(default_factory=dict)

    @classmethod
    def load_from_directory(cls, path: str | pathlib.Path) -> "ContextRegistry":
        registry = cls()
        dir_path = pathlib.Path(path)
        for yml_file in dir_path.glob("*.yml"):
            data = yaml.safe_load(yml_file.read_text())
            ctx = ContextConfig(**data)
            registry.contexts[ctx.name] = ctx
        for yaml_file in dir_path.glob("*.yaml"):
            data = yaml.safe_load(yaml_file.read_text())
            ctx = ContextConfig(**data)
            registry.contexts[ctx.name] = ctx
        return registry

    def get(self, name: str) -> ContextConfig | None:
        return self.contexts.get(name)

    def list_names(self) -> list[str]:
        return list(self.contexts.keys())
