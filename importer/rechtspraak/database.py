"""SQLite database operations for the Rechtspraak importer."""

import sqlite3
from pathlib import Path

from .config import DB_PATH, COMMIT_EVERY
from .models import SearchEntry, DecisionContent


def get_connection(db_path: Path = DB_PATH, readonly: bool = False) -> sqlite3.Connection:
    if readonly:
        uri = f"file:{db_path}?mode=ro"
        conn = sqlite3.connect(uri, uri=True)
    else:
        conn = sqlite3.connect(str(db_path))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Path = DB_PATH) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    migrations_dir = Path(__file__).parent.parent / "migrations"
    conn = get_connection(db_path)
    try:
        # Track applied migrations
        conn.execute("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT)")
        applied = {row[0] for row in conn.execute("SELECT name FROM _migrations").fetchall()}

        for sql_file in sorted(migrations_dir.glob("*.sql")):
            if sql_file.name not in applied:
                conn.executescript(sql_file.read_text())
                conn.execute("INSERT INTO _migrations (name) VALUES (?)", (sql_file.name,))
                conn.commit()
        conn.commit()
    finally:
        conn.close()


def upsert_decisions_from_search(conn: sqlite3.Connection, entries: list[SearchEntry]) -> int:
    """Insert or update decisions from search feed entries. Returns count of new inserts."""
    inserted = 0
    for entry in entries:
        cursor = conn.execute(
            """INSERT INTO decisions (ecli, title, summary, updated_at)
               VALUES (?, ?, ?, datetime('now'))
               ON CONFLICT(ecli) DO UPDATE SET
                   title = COALESCE(excluded.title, decisions.title),
                   summary = COALESCE(excluded.summary, decisions.summary),
                   updated_at = datetime('now')""",
            (entry.ecli, entry.title, entry.summary),
        )
        if cursor.lastrowid:
            inserted += 1
    return inserted


def upsert_decision_content(conn: sqlite3.Connection, content: DecisionContent) -> None:
    """Update a decision with its full content and metadata."""
    conn.execute(
        """UPDATE decisions SET
            decision_type = ?,
            decision_type_uri = ?,
            decision_date = ?,
            issued_date = ?,
            modified_date = ?,
            court_identifier = ?,
            court_name = ?,
            court_division = ?,
            case_number = ?,
            procedure_type = ?,
            procedure_type_uri = ?,
            coverage = ?,
            language = ?,
            alternative_title = ?,
            spatial = ?,
            temporal_start = ?,
            temporal_end = ?,
            public_url = ?,
            replaces = ?,
            is_replaced_by = ?,
            access_rights = ?,
            body_text = ?,
            body_text_length = LENGTH(?),
            body_xml = ?,
            inhoudsindicatie = ?,
            ii_length = LENGTH(?),
            metadata_xml = ?,
            fetch_status = 'fetched',
            fetch_attempts = fetch_attempts + 1,
            last_fetch_at = datetime('now'),
            updated_at = datetime('now')
        WHERE ecli = ?""",
        (
            content.decision_type,
            content.decision_type_uri,
            content.decision_date,
            content.issued_date,
            content.modified_date,
            content.court_identifier,
            content.court_name,
            content.court_division,
            content.case_number,
            content.procedure_type,
            content.procedure_type_uri,
            content.coverage,
            content.language,
            content.alternative_title,
            content.spatial,
            content.temporal_start,
            content.temporal_end,
            content.public_url,
            content.replaces,
            content.is_replaced_by,
            content.access_rights,
            content.body_text,
            content.body_text,  # for LENGTH(?) -> body_text_length
            content.body_xml,
            content.inhoudsindicatie,
            content.inhoudsindicatie,  # for LENGTH(?) -> ii_length
            content.metadata_xml,
            content.ecli,
        ),
    )

    # Update FTS index
    conn.execute("DELETE FROM decisions_fts WHERE ecli = ?", (content.ecli,))
    title_row = conn.execute("SELECT title, summary FROM decisions WHERE ecli = ?", (content.ecli,)).fetchone()
    if title_row:
        conn.execute(
            "INSERT INTO decisions_fts (ecli, title, summary, body_text, inhoudsindicatie) VALUES (?, ?, ?, ?, ?)",
            (content.ecli, title_row["title"], title_row["summary"], content.body_text, content.inhoudsindicatie),
        )

    # Upsert legal areas
    conn.execute("DELETE FROM decision_legal_areas WHERE ecli = ?", (content.ecli,))
    for area in content.legal_areas:
        conn.execute(
            "INSERT OR IGNORE INTO decision_legal_areas (ecli, legal_area_identifier, legal_area_name) VALUES (?, ?, ?)",
            (content.ecli, area.identifier, area.name),
        )

    # Upsert relations (now includes gevolg)
    conn.execute("DELETE FROM decision_relations WHERE ecli = ?", (content.ecli,))
    for rel in content.relations:
        conn.execute(
            "INSERT INTO decision_relations (ecli, related_ecli, relation_type, relation_aanleg, relation_gevolg, label) VALUES (?, ?, ?, ?, ?, ?)",
            (content.ecli, rel.related_ecli, rel.relation_type, rel.relation_aanleg, rel.relation_gevolg, rel.label),
        )

    # Upsert contributors (judges)
    conn.execute("DELETE FROM decision_contributors WHERE ecli = ?", (content.ecli,))
    for contrib in content.contributors:
        conn.execute(
            "INSERT OR IGNORE INTO decision_contributors (ecli, name, role) VALUES (?, ?, ?)",
            (content.ecli, contrib.name, contrib.role),
        )

    # Upsert references (law citations)
    conn.execute("DELETE FROM decision_references WHERE ecli = ?", (content.ecli,))
    for ref in content.references:
        conn.execute(
            "INSERT INTO decision_references (ecli, reference_type, identifier, label) VALUES (?, ?, ?, ?)",
            (content.ecli, ref.reference_type, ref.identifier, ref.label),
        )

    # Upsert vindplaatsen (publication venues)
    conn.execute("DELETE FROM decision_vindplaatsen WHERE ecli = ?", (content.ecli,))
    for vp in content.vindplaatsen:
        conn.execute(
            "INSERT OR IGNORE INTO decision_vindplaatsen (ecli, vindplaats) VALUES (?, ?)",
            (content.ecli, vp),
        )


def mark_fetch_failed(conn: sqlite3.Connection, ecli: str, error: str) -> None:
    conn.execute(
        """UPDATE decisions SET
            fetch_status = 'failed',
            fetch_attempts = fetch_attempts + 1,
            last_fetch_at = datetime('now'),
            updated_at = datetime('now')
        WHERE ecli = ?""",
        (ecli,),
    )


def mark_no_content(conn: sqlite3.Connection, ecli: str) -> None:
    conn.execute(
        """UPDATE decisions SET
            fetch_status = 'no_content',
            fetch_attempts = fetch_attempts + 1,
            last_fetch_at = datetime('now'),
            updated_at = datetime('now')
        WHERE ecli = ?""",
        (ecli,),
    )


def get_pending_eclis(conn: sqlite3.Connection, limit: int = 1000) -> list[str]:
    rows = conn.execute(
        "SELECT ecli FROM decisions WHERE fetch_status = 'pending' LIMIT ?",
        (limit,),
    ).fetchall()
    return [r["ecli"] for r in rows]


def get_failed_eclis(conn: sqlite3.Connection, max_attempts: int = 3, limit: int = 1000) -> list[str]:
    rows = conn.execute(
        "SELECT ecli FROM decisions WHERE fetch_status = 'failed' AND fetch_attempts < ? LIMIT ?",
        (max_attempts, limit),
    ).fetchall()
    return [r["ecli"] for r in rows]


def save_crawl_state(
    conn: sqlite3.Connection,
    crawl_type: str,
    date_from: str,
    date_to: str,
    current_date_cursor: str | None = None,
    total_indexed: int = 0,
    status: str = "running",
    crawl_id: int | None = None,
) -> int:
    if crawl_id:
        conn.execute(
            """UPDATE crawl_state SET
                current_date_cursor = ?, total_indexed = ?, status = ?,
                completed_at = CASE WHEN ? IN ('completed', 'failed') THEN datetime('now') ELSE NULL END
            WHERE id = ?""",
            (current_date_cursor, total_indexed, status, status, crawl_id),
        )
        return crawl_id
    else:
        cursor = conn.execute(
            "INSERT INTO crawl_state (crawl_type, date_from, date_to, current_date_cursor, total_indexed, status) VALUES (?, ?, ?, ?, ?, ?)",
            (crawl_type, date_from, date_to, current_date_cursor, total_indexed, status),
        )
        return cursor.lastrowid


def get_active_crawl(conn: sqlite3.Connection) -> dict | None:
    row = conn.execute(
        "SELECT * FROM crawl_state WHERE status = 'running' ORDER BY id DESC LIMIT 1"
    ).fetchone()
    return dict(row) if row else None


def get_stats(conn: sqlite3.Connection) -> dict:
    total = conn.execute("SELECT COUNT(*) as c FROM decisions").fetchone()["c"]
    fetched = conn.execute("SELECT COUNT(*) as c FROM decisions WHERE fetch_status = 'fetched'").fetchone()["c"]
    pending = conn.execute("SELECT COUNT(*) as c FROM decisions WHERE fetch_status = 'pending'").fetchone()["c"]
    failed = conn.execute("SELECT COUNT(*) as c FROM decisions WHERE fetch_status = 'failed'").fetchone()["c"]
    return {"total": total, "fetched": fetched, "pending": pending, "failed": failed}
