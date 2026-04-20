"""Search index crawler - discovers ECLIs by crawling the search API day by day."""

import logging
from datetime import date, timedelta

from .client import RechtspraakClient
from .config import SEARCH_URL, MAX_RESULTS_PER_PAGE
from .parser import parse_search_feed
from .models import SearchEntry

logger = logging.getLogger(__name__)


async def crawl_date(
    client: RechtspraakClient,
    target_date: date,
) -> list[SearchEntry]:
    """Crawl all decisions for a single date. Handles pagination."""
    all_entries = []
    offset = 0

    while True:
        params = {
            "date": target_date.isoformat(),
            "max": str(MAX_RESULTS_PER_PAGE),
            "return": "DOC",
            "sort": "ASC",
        }
        if offset > 0:
            params["from"] = str(offset)

        try:
            xml_bytes = await client.get_bytes(SEARCH_URL, params=params)
            total, entries = parse_search_feed(xml_bytes)
        except Exception as e:
            logger.error(f"Failed to crawl date {target_date} offset {offset}: {e}")
            break

        all_entries.extend(entries)

        if len(entries) < MAX_RESULTS_PER_PAGE or offset + len(entries) >= total:
            break

        offset += len(entries)
        logger.debug(f"  Paginating {target_date}: offset {offset}/{total}")

    return all_entries


async def crawl_date_range(
    client: RechtspraakClient,
    date_from: date,
    date_to: date,
    resume_from: date | None = None,
    callback=None,
) -> int:
    """Crawl the search index for a date range, day by day.

    Args:
        client: HTTP client
        date_from: Start date (inclusive)
        date_to: End date (inclusive)
        resume_from: Resume from this date (skip earlier dates)
        callback: async callback(date, entries) called for each day's results

    Returns:
        Total number of entries found
    """
    total_entries = 0
    current = resume_from or date_from

    while current <= date_to:
        entries = await crawl_date(client, current)

        if entries:
            total_entries += len(entries)
            logger.info(f"  {current}: {len(entries)} decisions (total: {total_entries})")
            if callback:
                await callback(current, entries)
        else:
            logger.debug(f"  {current}: 0 decisions")

        current += timedelta(days=1)

    return total_entries


async def crawl_modified_since(
    client: RechtspraakClient,
    modified_since: str,
    callback=None,
) -> int:
    """Crawl decisions modified since a given datetime.

    Args:
        modified_since: ISO datetime string (YYYY-MM-DDTHH:MM:SS)
        callback: async callback(entries) called for each page of results

    Returns:
        Total number of entries found
    """
    total_entries = 0
    offset = 0

    while True:
        params = {
            "modified": modified_since,
            "max": str(MAX_RESULTS_PER_PAGE),
            "sort": "ASC",
            "return": "DOC",
        }
        if offset > 0:
            params["from"] = str(offset)

        try:
            xml_bytes = await client.get_bytes(SEARCH_URL, params=params)
            total, entries = parse_search_feed(xml_bytes)
        except Exception as e:
            logger.error(f"Failed to crawl modified since {modified_since} offset {offset}: {e}")
            break

        if entries:
            total_entries += len(entries)
            logger.info(f"  Modified since {modified_since}: page {offset // MAX_RESULTS_PER_PAGE + 1}, {len(entries)} entries (total: {total_entries})")
            if callback:
                await callback(entries)

        if len(entries) < MAX_RESULTS_PER_PAGE or offset + len(entries) >= total:
            break

        offset += len(entries)

    return total_entries
