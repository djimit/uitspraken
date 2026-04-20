"""CLI entrypoint for the Rechtspraak importer."""

import asyncio
import logging
from datetime import date, datetime
from pathlib import Path

import click

from .config import DB_PATH
from .database import init_db, get_connection, get_stats
from .pipeline import (
    run_full_import, run_index_crawl, run_content_fetch,
    run_retry_failed, run_incremental_update,
)
from .value_lists import fetch_and_store_value_lists


def setup_logging(verbose: bool):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


@click.group()
@click.option("--verbose", "-v", is_flag=True, help="Enable debug logging")
def cli(verbose):
    """Rechtspraak Open Data importer."""
    setup_logging(verbose)


@cli.command()
@click.option("--from", "date_from", required=True, type=click.DateTime(formats=["%Y-%m-%d"]), help="Start date (YYYY-MM-DD)")
@click.option("--to", "date_to", required=True, type=click.DateTime(formats=["%Y-%m-%d"]), help="End date (YYYY-MM-DD)")
@click.option("--db", type=click.Path(), default=None, help="Database path")
@click.option("--concurrency", "-c", default=3, help="Max concurrent requests")
@click.option("--rate", "-r", default=5.0, help="Requests per second")
@click.option("--max-content", type=int, default=None, help="Max decisions to fetch content for (for testing)")
def full_import(date_from, date_to, db, concurrency, rate, max_content):
    """Run a full import: index crawl + content fetch."""
    db_path = Path(db) if db else DB_PATH
    asyncio.run(run_full_import(
        date_from.date(), date_to.date(), db_path,
        concurrency=concurrency, rate=rate, max_content=max_content,
    ))


@cli.command()
@click.option("--from", "date_from", required=True, type=click.DateTime(formats=["%Y-%m-%d"]), help="Start date")
@click.option("--to", "date_to", required=True, type=click.DateTime(formats=["%Y-%m-%d"]), help="End date")
@click.option("--db", type=click.Path(), default=None)
@click.option("--concurrency", "-c", default=3)
@click.option("--rate", "-r", default=5.0)
def index_crawl(date_from, date_to, db, concurrency, rate):
    """Crawl the search index only (Phase 1)."""
    db_path = Path(db) if db else DB_PATH
    asyncio.run(run_index_crawl(date_from.date(), date_to.date(), db_path, concurrency, rate))


@cli.command()
@click.option("--db", type=click.Path(), default=None)
@click.option("--batch-size", "-b", default=200)
@click.option("--concurrency", "-c", default=3)
@click.option("--rate", "-r", default=5.0)
@click.option("--max", "max_decisions", type=int, default=None, help="Max decisions to fetch")
def fetch_content(db, batch_size, concurrency, rate, max_decisions):
    """Fetch content for pending ECLIs (Phase 2)."""
    db_path = Path(db) if db else DB_PATH
    asyncio.run(run_content_fetch(db_path, batch_size, concurrency, rate, max_decisions))


@cli.command()
@click.option("--db", type=click.Path(), default=None)
@click.option("--max-attempts", default=3)
@click.option("--batch-size", "-b", default=200)
@click.option("--concurrency", "-c", default=3)
@click.option("--rate", "-r", default=5.0)
def retry_failed(db, max_attempts, batch_size, concurrency, rate):
    """Retry previously failed content fetches."""
    db_path = Path(db) if db else DB_PATH
    asyncio.run(run_retry_failed(db_path, max_attempts, batch_size, concurrency, rate))


@cli.command()
@click.option("--db", type=click.Path(), default=None)
@click.option("--concurrency", "-c", default=3)
@click.option("--rate", "-r", default=5.0)
@click.option("--batch-size", "-b", default=200)
def incremental_update(db, concurrency, rate, batch_size):
    """Run incremental update from last modified date."""
    db_path = Path(db) if db else DB_PATH
    asyncio.run(run_incremental_update(db_path, concurrency, rate, batch_size))


@cli.command()
@click.option("--db", type=click.Path(), default=None)
def stats(db):
    """Show import statistics."""
    db_path = Path(db) if db else DB_PATH
    init_db(db_path)
    conn = get_connection(db_path)
    s = get_stats(conn)
    conn.close()

    click.echo(f"Total decisions:   {s['total']:>10,}")
    click.echo(f"  Fetched:         {s['fetched']:>10,}")
    click.echo(f"  Pending:         {s['pending']:>10,}")
    click.echo(f"  Failed:          {s['failed']:>10,}")


@cli.command()
@click.option("--db", type=click.Path(), default=None)
def init(db):
    """Initialize the database."""
    db_path = Path(db) if db else DB_PATH
    init_db(db_path)
    click.echo(f"Database initialized at {db_path}")


@cli.command("update-value-lists")
@click.option("--db", type=click.Path(), default=None)
def update_value_lists(db):
    """Fetch and store value lists (courts, legal areas, procedure types)."""
    db_path = Path(db) if db else DB_PATH
    init_db(db_path)
    conn = get_connection(db_path)
    result = fetch_and_store_value_lists(conn)
    conn.close()
    click.echo(f"Value lists updated: {result}")


@cli.command("reparse")
@click.option("--db", type=click.Path(), default=None)
@click.option("--batch-size", "-b", default=500, help="Batch size for commits")
def reparse(db, batch_size):
    """Re-parse metadata_xml for all fetched decisions.

    Used after upgrading the parser to extract newly-added fields
    from the already-stored XML.
    """
    from tqdm import tqdm
    from .parser import parse_decision_content
    from .database import upsert_decision_content

    db_path = Path(db) if db else DB_PATH
    init_db(db_path)
    conn = get_connection(db_path)

    # Get all fetched decisions that have metadata_xml
    total = conn.execute(
        "SELECT COUNT(*) as c FROM decisions WHERE fetch_status = 'fetched' AND metadata_xml IS NOT NULL"
    ).fetchone()["c"]

    click.echo(f"Re-parsing {total:,} fetched decisions with stored XML...")

    rows = conn.execute(
        "SELECT ecli, metadata_xml, body_xml FROM decisions WHERE fetch_status = 'fetched' AND metadata_xml IS NOT NULL"
    ).fetchall()

    success = 0
    errors = 0
    for i, row in enumerate(tqdm(rows, desc="Re-parsing", unit="decisions")):
        try:
            ecli = row["ecli"]
            metadata_xml = row["metadata_xml"]
            body_xml = row["body_xml"]

            # Reconstruct a minimal XML document from stored parts
            # to re-parse with the new parser
            xml_parts = ['<?xml version="1.0" encoding="utf-8"?><open-rechtspraak>']
            if metadata_xml:
                xml_parts.append(metadata_xml)
            # Re-add inhoudsindicatie and body from body_xml
            if body_xml:
                xml_parts.append(body_xml)
            xml_parts.append('</open-rechtspraak>')
            xml_str = ''.join(xml_parts)

            content = parse_decision_content(xml_str.encode('utf-8'))
            content.ecli = ecli  # ensure we keep the original ecli

            # Use the standard upsert but without incrementing fetch_attempts
            # We temporarily patch to avoid re-counting
            upsert_decision_content(conn, content)

            success += 1

            if (i + 1) % batch_size == 0:
                conn.commit()
        except Exception as e:
            errors += 1
            if errors <= 10:
                click.echo(f"  Error re-parsing {row['ecli']}: {e}", err=True)

    conn.commit()
    conn.close()
    click.echo(f"Re-parse complete: {success:,} success, {errors:,} errors")


@cli.command("rebuild-ii-cache")
@click.option("--db", type=click.Path(), default=None)
def rebuild_ii_cache_cmd(db):
    """Rebuild the inhoudsindicatie analysis cache."""
    from .ii_cache import rebuild_ii_cache

    db_path = Path(db) if db else DB_PATH
    init_db(db_path)
    conn = get_connection(db_path)
    rebuild_ii_cache(conn)
    conn.close()
    click.echo("Inhoudsindicatie analysis cache rebuilt.")


if __name__ == "__main__":
    cli()
