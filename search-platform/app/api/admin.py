from fastapi import APIRouter, Depends, HTTPException

from app.engine.port import SearchEnginePort
from app.index.context_registry import ContextRegistry
from app.index.templates import build_index_template

router = APIRouter(prefix="/v1/admin")

_registry: ContextRegistry | None = None


def get_registry() -> ContextRegistry:
    if _registry is None:
        raise HTTPException(status_code=503, detail="Registry not initialized")
    return _registry


def set_registry(registry: ContextRegistry) -> None:
    global _registry
    _registry = registry


def get_engine() -> SearchEnginePort:
    raise NotImplementedError("Wire up via dependency injection in main.py")


@router.get("/contexts")
async def list_contexts(registry: ContextRegistry = Depends(get_registry)):
    return {"contexts": registry.list_names()}


@router.get("/contexts/{name}")
async def get_context(name: str, registry: ContextRegistry = Depends(get_registry)):
    ctx = registry.get(name)
    if not ctx:
        raise HTTPException(status_code=404, detail=f"Context {name!r} not found")
    return ctx.model_dump()


@router.post("/contexts/{name}/provision")
async def provision_context(
    name: str,
    registry: ContextRegistry = Depends(get_registry),
    engine: SearchEnginePort = Depends(get_engine),
):
    ctx = registry.get(name)
    if not ctx:
        raise HTTPException(status_code=404, detail=f"Context {name!r} not found")
    template = build_index_template(ctx)
    await engine.create_index(ctx.name, template)
    return {"provisioned": name}


@router.post("/contexts/{name}/reindex")
async def reindex_context(
    name: str,
    registry: ContextRegistry = Depends(get_registry),
):
    return {"reindexed": name, "status": "not_implemented"}


@router.delete("/contexts/{name}")
async def delete_context(
    name: str,
    engine: SearchEnginePort = Depends(get_engine),
):
    await engine.delete_index(name)
    return {"deleted": name}
