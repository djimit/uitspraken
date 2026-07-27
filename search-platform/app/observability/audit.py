import time
import uuid

import structlog

logger = structlog.get_logger("audit")


def log_search_request(
    ctx: str,
    user: str,
    query: str | None,
    result_count: int,
    took_ms: int,
) -> str:
    event_id = str(uuid.uuid4())
    logger.info(
        "search_request",
        event_id=event_id,
        context=ctx,
        user=user,
        query_length=len(query) if query else 0,
        result_count=result_count,
        took_ms=took_ms,
        timestamp=time.time(),
    )
    return event_id


def log_access_denied(user: str, ctx: str, reason: str) -> None:
    logger.warning(
        "access_denied",
        user=user,
        context=ctx,
        reason=reason,
        timestamp=time.time(),
    )
