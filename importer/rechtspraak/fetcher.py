"""Content fetcher - fetches full decision content for individual ECLIs."""

import asyncio
import logging

from .client import RechtspraakClient
from .config import CONTENT_URL
from .parser import parse_decision_content
from .models import DecisionContent

logger = logging.getLogger(__name__)


async def fetch_decision(client: RechtspraakClient, ecli: str) -> DecisionContent | None:
    """Fetch and parse the full content for a single ECLI."""
    try:
        xml_bytes = await client.get_bytes(CONTENT_URL, params={"id": ecli})
        if not xml_bytes or len(xml_bytes) < 50:
            return None
        content = parse_decision_content(xml_bytes)
        if not content.ecli:
            content.ecli = ecli
        return content
    except Exception as e:
        logger.error(f"Failed to fetch {ecli}: {e}")
        raise


async def fetch_batch(
    client: RechtspraakClient,
    eclis: list[str],
    on_success=None,
    on_failure=None,
    on_no_content=None,
) -> dict:
    """Fetch content for a batch of ECLIs concurrently.

    Args:
        client: HTTP client
        eclis: List of ECLIs to fetch
        on_success: async callback(DecisionContent) on success
        on_failure: async callback(ecli, error_str) on failure
        on_no_content: async callback(ecli) when no content available

    Returns:
        Stats dict with counts
    """
    stats = {"success": 0, "failed": 0, "no_content": 0}

    async def _fetch_one(ecli: str):
        try:
            content = await fetch_decision(client, ecli)
        except Exception as e:
            stats["failed"] += 1
            if on_failure:
                await on_failure(ecli, str(e))
            return

        if content and (content.body_text or content.metadata_xml):
            try:
                if on_success:
                    await on_success(content)
                stats["success"] += 1
            except Exception as e:
                logger.error(f"Error saving {ecli}: {e}")
                stats["failed"] += 1
                if on_failure:
                    await on_failure(ecli, f"save error: {e}")
        else:
            stats["no_content"] += 1
            if on_no_content:
                await on_no_content(ecli)

    tasks = [_fetch_one(ecli) for ecli in eclis]
    await asyncio.gather(*tasks)
    return stats
