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

    click.echo(f"Total decisions:   {s['total']:>10,}")
    click.echo(f"  Fetched:         {s['fetched']:>10,}")
    click.echo(f"  Pending:         {s['pending']:>10,}")
    click.echo(f"  Failed:          {s['failed']:>10,}")

    # PII stats
    anon_count = conn.execute(
        "SELECT COUNT(*) as c FROM decisions WHERE body_text_anonymized IS NOT NULL"
    ).fetchone()["c"]
    pii_fixed = conn.execute(
        "SELECT COALESCE(SUM(violations_fixed), 0) as c FROM _pii_remediation"
    ).fetchone()["c"]

    cache_total = 0
    cache_exists = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='_pseudo_cache'"
    ).fetchone()
    if cache_exists:
        cache_total = conn.execute("SELECT COUNT(*) as c FROM _pseudo_cache").fetchone()["c"]

    click.echo(f"\nPII Status:")
    click.echo(f"  JS-detected:     {cache_total:>10,}")
    click.echo(f"  Remediated:      {anon_count:>10,}")
    click.echo(f"  PII fixed:       {pii_fixed:>10,}")

    conn.close()


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


@cli.command("pseudonymize")
@click.option("--db", type=click.Path(), default=None)
@click.option("--ecli", type=str, default=None, help="Single ECLI to pseudonymize")
@click.option("--dry-run", is_flag=True, help="Scan only, no write")
@click.option("--limit", type=int, default=None, help="Max decisions to process")
@click.option("--batch-size", "-b", default=100, help="Commit batch size")
def pseudonymize_cmd(db, ecli, dry_run, limit, batch_size):
    """Run PII detection and anonymization on fetched decisions.

    Without --ecli, processes all decisions in _pseudo_cache (the ~25K
    decisions with JS-verified PII violations). Use --dry-run to scan
    without writing.
    """
    from tqdm import tqdm
    from .pseudonymize import anonymize_decision

    db_path = Path(db) if db else DB_PATH
    init_db(db_path)
    conn = get_connection(db_path)

    if ecli:
        row = conn.execute(
            "SELECT ecli, body_text FROM decisions WHERE ecli = ? AND fetch_status = 'fetched'",
            (ecli,),
        ).fetchone()
        if not row or not row["body_text"]:
            click.echo(f"Decision {ecli} not found or has no body_text")
            conn.close()
            return

        body = row["body_text"]
        anonymized, violations = anonymize_decision(body)
        click.echo(f"{ecli}: {len(violations)} violations found")

        for v in violations:
            click.echo(f"  [{v.severity}] {v.label}: '{v.match}' -> {v.suggestion}")

        if not dry_run and violations:
            conn.execute(
                "UPDATE decisions SET body_text_anonymized = ?, updated_at = datetime('now') WHERE ecli = ?",
                (anonymized, ecli),
            )
            conn.execute(
                """INSERT INTO _pii_remediation (ecli, violations_found, violations_fixed)
                   VALUES (?, ?, ?) ON CONFLICT(ecli) DO UPDATE SET
                   violations_found=excluded.violations_found,
                   violations_fixed=excluded.violations_fixed,
                   remediation_at=datetime('now')""",
                (ecli, len(violations), len(violations)),
            )
            conn.commit()
            click.echo(f"  Anonymized text saved ({len(anonymized)} chars)")

        conn.close()
        return

    # Batch mode: all violations from _pseudo_cache
    cache_exists = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='_pseudo_cache'"
    ).fetchone()

    if cache_exists:
        total_q = "SELECT COUNT(*) as c FROM _pseudo_cache"
    else:
        click.echo("No _pseudo_cache table found. Run build-pseudo-cache.ts first.")
        click.echo("Falling back to scanning ALL fetched decisions (slow)...")
        total_q = "SELECT COUNT(*) as c FROM decisions WHERE fetch_status = 'fetched' AND body_text IS NOT NULL"

    total = conn.execute(total_q).fetchone()["c"]
    if limit:
        total = min(total, limit)

    click.echo(f"Processing {total:,} decisions{' (dry-run)' if dry_run else ''}...")

    if cache_exists:
        query = """
            SELECT d.ecli, d.body_text FROM decisions d
            INNER JOIN _pseudo_cache pc ON d.ecli = pc.ecli
            WHERE d.body_text IS NOT NULL
            ORDER BY d.decision_date DESC
        """
    else:
        query = """
            SELECT ecli, body_text FROM decisions
            WHERE fetch_status = 'fetched' AND body_text IS NOT NULL
            ORDER BY decision_date DESC
        """

    if limit:
        query += f" LIMIT {limit}"

    rows = conn.execute(query).fetchall()
    total_violations = 0
    total_fixed = 0
    processed = 0

    for row in tqdm(rows, desc="Anonymizing", unit="decisions"):
        body = row["body_text"]
        anonymized, violations = anonymize_decision(body)

        total_violations += len(violations)

        if violations and not dry_run:
            conn.execute(
                "UPDATE decisions SET body_text_anonymized = ? WHERE ecli = ?",
                (anonymized, row["ecli"]),
            )
            conn.execute(
                """INSERT INTO _pii_remediation (ecli, violations_found, violations_fixed)
                   VALUES (?, ?, ?) ON CONFLICT(ecli) DO UPDATE SET
                   violations_found=excluded.violations_found,
                   violations_fixed=excluded.violations_fixed,
                   remediation_at=datetime('now')""",
                (row["ecli"], len(violations), len(violations)),
            )
            total_fixed += len(violations)

        processed += 1
        if processed % batch_size == 0 and not dry_run:
            conn.commit()

    if not dry_run:
        conn.commit()

    conn.close()
    click.echo(f"\nProcessed {processed:,} decisions")
    click.echo(f"  Total violations:  {total_violations:>10,}")
    if not dry_run:
        click.echo(f"  Total fixed:       {total_fixed:>10,}")


@cli.command("pseudonymize-stats")
@click.option("--db", type=click.Path(), default=None)
def pseudonymize_stats_cmd(db):
    """Show PII remediation statistics."""
    db_path = Path(db) if db else DB_PATH
    init_db(db_path)
    conn = get_connection(db_path)

    # Remediation stats
    rem_total = conn.execute("SELECT COUNT(*) as c FROM _pii_remediation").fetchone()["c"]
    rem_violations = conn.execute(
        "SELECT COALESCE(SUM(violations_fixed), 0) as c FROM _pii_remediation"
    ).fetchone()["c"]

    # Cache stats (from dashboard)
    cache_total = 0
    cache_exists = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='_pseudo_cache'"
    ).fetchone()
    if cache_exists:
        cache_total = conn.execute("SELECT COUNT(*) as c FROM _pseudo_cache").fetchone()["c"]

    # Anonymized column coverage
    anon_count = conn.execute(
        "SELECT COUNT(*) as c FROM decisions WHERE body_text_anonymized IS NOT NULL"
    ).fetchone()["c"]

    click.echo("PII Remediation Status")
    click.echo("=" * 40)
    click.echo(f"  Cache violations (JS-detected):  {cache_total:>10,}")
    click.echo(f"  Decisions remediated:            {rem_total:>10,}")
    click.echo(f"  Total PII replacements:          {rem_violations:>10,}")
    click.echo(f"  Anonymized column coverage:      {anon_count:>10,}")
    click.echo(f"  Remaining (cache - remediated):  {max(0, cache_total - rem_total):>10,}")

    conn.close()


if __name__ == "__main__":
    cli()
