"""ETL pipeline orchestration for full and incremental imports."""

import asyncio
import logging
from datetime import date, datetime
from pathlib import Path

from tqdm import tqdm

from .client import RechtspraakClient
from .config import DB_PATH, DEFAULT_BATCH_SIZE, COMMIT_EVERY
from .crawler import crawl_date_range, crawl_modified_since
from .database import (
    get_connection, init_db, upsert_decisions_from_search,
    upsert_decision_content, mark_fetch_failed, mark_no_content,
    get_pending_eclis, get_failed_eclis, save_crawl_state, get_active_crawl, get_stats,
)
from .fetcher import fetch_batch
from .ii_cache import rebuild_ii_cache

logger = logging.getLogger(__name__)


async def run_index_crawl(
    date_from: date,
    date_to: date,
    db_path: Path = DB_PATH,
    concurrency: int = 3,
    rate: float = 5.0,
) -> int:
    """Phase 1: Crawl the search index and store all ECLIs."""
    init_db(db_path)
    conn = get_connection(db_path)
    total_days = (date_to - date_from).days + 1

    # Check for resumable crawl
    active_crawl = get_active_crawl(conn)
    resume_from = None
    crawl_id = None

    if active_crawl:
        resume_from = date.fromisoformat(active_crawl["current_date_cursor"]) if active_crawl["current_date_cursor"] else None
        crawl_id = active_crawl["id"]
        logger.info(f"Resuming crawl {crawl_id} from {resume_from}")

    if not crawl_id:
        crawl_id = save_crawl_state(conn, "full", date_from.isoformat(), date_to.isoformat())
        conn.commit()

    total_indexed = active_crawl["total_indexed"] if active_crawl else 0
    batch_count = 0

    pbar = tqdm(total=total_days, desc="Crawling index", unit="days")
    if resume_from:
        pbar.update((resume_from - date_from).days)

    async def on_day_results(day: date, entries):
        nonlocal total_indexed, batch_count
        upsert_decisions_from_search(conn, entries)
        total_indexed += len(entries)
        batch_count += len(entries)

        if batch_count >= COMMIT_EVERY:
            save_crawl_state(conn, "full", date_from.isoformat(), date_to.isoformat(),
                           current_date_cursor=day.isoformat(), total_indexed=total_indexed,
                           crawl_id=crawl_id)
            conn.commit()
            batch_count = 0

        pbar.update(1)
        pbar.set_postfix({"indexed": total_indexed})

    async with RechtspraakClient(concurrency=concurrency, rate=rate) as client:
        await crawl_date_range(client, date_from, date_to, resume_from=resume_from, callback=on_day_results)

    save_crawl_state(conn, "full", date_from.isoformat(), date_to.isoformat(),
                   current_date_cursor=date_to.isoformat(), total_indexed=total_indexed,
                   status="completed", crawl_id=crawl_id)
    conn.commit()
    conn.close()
    pbar.close()

    logger.info(f"Index crawl complete: {total_indexed} ECLIs indexed")
    return total_indexed


async def run_content_fetch(
    db_path: Path = DB_PATH,
    batch_size: int = DEFAULT_BATCH_SIZE,
    concurrency: int = 3,
    rate: float = 5.0,
    max_decisions: int | None = None,
) -> dict:
    """Phase 2: Fetch full content for all pending ECLIs."""
    conn = get_connection(db_path)
    stats_total = {"success": 0, "failed": 0, "no_content": 0}

    # Count total pending
    pending_count = conn.execute("SELECT COUNT(*) as c FROM decisions WHERE fetch_status = 'pending'").fetchone()["c"]
    if max_decisions:
        pending_count = min(pending_count, max_decisions)

    logger.info(f"Fetching content for {pending_count} decisions...")
    pbar = tqdm(total=pending_count, desc="Fetching content", unit="decisions")

    fetched_total = 0

    async with RechtspraakClient(concurrency=concurrency, rate=rate) as client:
        while True:
            eclis = get_pending_eclis(conn, limit=batch_size)
            if not eclis:
                break

            if max_decisions and fetched_total >= max_decisions:
                break

            if max_decisions:
                eclis = eclis[:max_decisions - fetched_total]

            async def on_success(content):
                upsert_decision_content(conn, content)

            async def on_failure(ecli, error):
                mark_fetch_failed(conn, ecli, error)
                logger.debug(f"Failed: {ecli}: {error}")

            async def on_no_content(ecli):
                mark_no_content(conn, ecli)

            batch_stats = await fetch_batch(client, eclis, on_success, on_failure, on_no_content)

            for k in stats_total:
                stats_total[k] += batch_stats[k]

            fetched_total += len(eclis)
            pbar.update(len(eclis))
            pbar.set_postfix(stats_total)

            conn.commit()

            # Periodically checkpoint WAL to prevent it from growing huge
            # (a 6GB+ WAL makes all readers extremely slow)
            if fetched_total % 2000 == 0:
                conn.execute("PRAGMA wal_checkpoint(PASSIVE)")

    # Final WAL checkpoint before cache rebuild
    conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")

    # Rebuild analysis caches after fetch
    logger.info("Rebuilding inhoudsindicatie analysis cache...")
    rebuild_ii_cache(conn)

    conn.close()
    pbar.close()
    logger.info(f"Content fetch complete: {stats_total}")
    return stats_total


async def run_retry_failed(
    db_path: Path = DB_PATH,
    max_attempts: int = 3,
    batch_size: int = DEFAULT_BATCH_SIZE,
    concurrency: int = 3,
    rate: float = 5.0,
) -> dict:
    """Phase 3: Retry previously failed fetches."""
    conn = get_connection(db_path)
    stats_total = {"success": 0, "failed": 0, "no_content": 0}

    failed_count = conn.execute(
        "SELECT COUNT(*) as c FROM decisions WHERE fetch_status = 'failed' AND fetch_attempts < ?",
        (max_attempts,),
    ).fetchone()["c"]

    logger.info(f"Retrying {failed_count} failed decisions...")
    pbar = tqdm(total=failed_count, desc="Retrying failed", unit="decisions")

    async with RechtspraakClient(concurrency=concurrency, rate=rate) as client:
        while True:
            eclis = get_failed_eclis(conn, max_attempts=max_attempts, limit=batch_size)
            if not eclis:
                break

            async def on_success(content):
                upsert_decision_content(conn, content)

            async def on_failure(ecli, error):
                mark_fetch_failed(conn, ecli, error)

            async def on_no_content(ecli):
                mark_no_content(conn, ecli)

            batch_stats = await fetch_batch(client, eclis, on_success, on_failure, on_no_content)
            for k in stats_total:
                stats_total[k] += batch_stats[k]

            pbar.update(len(eclis))
            pbar.set_postfix(stats_total)
            conn.commit()

    conn.close()
    pbar.close()
    return stats_total


async def run_full_import(
    date_from: date,
    date_to: date,
    db_path: Path = DB_PATH,
    concurrency: int = 3,
    rate: float = 5.0,
    content_batch_size: int = DEFAULT_BATCH_SIZE,
    max_content: int | None = None,
) -> None:
    """Run a full import: value lists + index crawl + content fetch."""
    logger.info(f"Starting full import from {date_from} to {date_to}")

    # Phase 0: Value lists
    from .value_lists import fetch_and_store_value_lists
    init_db(db_path)
    conn = get_connection(db_path)
    try:
        vl_stats = fetch_and_store_value_lists(conn)
        logger.info(f"Phase 0 complete: value lists {vl_stats}")
    except Exception as e:
        logger.warning(f"Value list fetch failed (non-fatal): {e}")
    finally:
        conn.close()

    # Phase 1: Index crawl
    total = await run_index_crawl(date_from, date_to, db_path, concurrency, rate)
    logger.info(f"Phase 1 complete: {total} ECLIs indexed")

    # Phase 2: Content fetch
    stats = await run_content_fetch(db_path, content_batch_size, concurrency, rate, max_content)
    logger.info(f"Phase 2 complete: {stats}")

    # Phase 3: Retry failed
    retry_stats = await run_retry_failed(db_path, batch_size=content_batch_size, concurrency=concurrency, rate=rate)
    logger.info(f"Phase 3 complete: {retry_stats}")

    # Report
    conn = get_connection(db_path)
    final_stats = get_stats(conn)
    conn.close()
    logger.info(f"Import complete! Final stats: {final_stats}")


async def run_incremental_update(
    db_path: Path = DB_PATH,
    concurrency: int = 3,
    rate: float = 5.0,
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> None:
    """Run an incremental update based on modification dates."""
    conn = get_connection(db_path)

    # Find the latest modified date in the database
    row = conn.execute("SELECT MAX(modified_date) as latest FROM decisions WHERE modified_date IS NOT NULL").fetchone()
    if not row or not row["latest"]:
        logger.error("No existing data found. Run a full import first.")
        conn.close()
        return

    modified_since = row["latest"]
    logger.info(f"Incremental update: fetching changes since {modified_since}")

    async def on_entries(entries):
        upsert_decisions_from_search(conn, entries)
        conn.commit()

    async with RechtspraakClient(concurrency=concurrency, rate=rate) as client:
        total = await crawl_modified_since(client, modified_since, callback=on_entries)

    logger.info(f"Found {total} new/modified entries")
    conn.close()

    # Fetch content for new entries
    if total > 0:
        stats = await run_content_fetch(db_path, batch_size, concurrency, rate)
        logger.info(f"Content fetch complete: {stats}")
