from fastapi import FastAPI

from app.api.admin import router as admin_router
from app.api.explain import router as explain_router
from app.api.search import router as search_router

app = FastAPI(title="Search Platform Dienst", version="0.1.0")

app.include_router(search_router)
app.include_router(admin_router)
app.include_router(explain_router)


@app.on_event("startup")
async def _init_registry():
    from app.api.admin import set_registry
    from app.index.context_registry import ContextRegistry

    registry = ContextRegistry.load_from_directory("contexts")
    set_registry(registry)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/readyz")
async def readyz():
    return {"status": "ok"}


@app.get("/metrics")
async def metrics():
    return {"uptime_seconds": 0, "requests_total": 0}
