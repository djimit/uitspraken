-- Courts reference table
CREATE TABLE IF NOT EXISTS courts (
    identifier TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    abbreviation TEXT,
    type TEXT,
    begin_date TEXT,
    end_date TEXT
);

-- Legal areas (hierarchical)
CREATE TABLE IF NOT EXISTS legal_areas (
    identifier TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_identifier TEXT,
    FOREIGN KEY (parent_identifier) REFERENCES legal_areas(identifier)
);

-- Procedure types
CREATE TABLE IF NOT EXISTS procedure_types (
    identifier TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- Main decisions table
CREATE TABLE IF NOT EXISTS decisions (
    ecli TEXT PRIMARY KEY,
    title TEXT,
    summary TEXT,
    decision_type TEXT,
    decision_type_uri TEXT,
    decision_date TEXT,
    issued_date TEXT,
    modified_date TEXT,
    court_identifier TEXT,
    court_name TEXT,
    case_number TEXT,
    procedure_type TEXT,
    procedure_type_uri TEXT,
    coverage TEXT,
    language TEXT DEFAULT 'nl',
    body_text TEXT,
    body_xml TEXT,
    inhoudsindicatie TEXT,
    metadata_xml TEXT,
    fetch_status TEXT DEFAULT 'pending',
    fetch_attempts INTEGER DEFAULT 0,
    last_fetch_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Decision legal areas (many-to-many)
CREATE TABLE IF NOT EXISTS decision_legal_areas (
    ecli TEXT NOT NULL,
    legal_area_identifier TEXT NOT NULL,
    legal_area_name TEXT NOT NULL,
    PRIMARY KEY (ecli, legal_area_identifier)
);

-- Relations between decisions
CREATE TABLE IF NOT EXISTS decision_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ecli TEXT NOT NULL,
    related_ecli TEXT,
    relation_type TEXT,
    relation_aanleg TEXT,
    label TEXT
);

-- Crawl state tracking
CREATE TABLE IF NOT EXISTS crawl_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crawl_type TEXT NOT NULL,
    date_from TEXT,
    date_to TEXT,
    current_date_cursor TEXT,
    current_offset INTEGER DEFAULT 0,
    total_indexed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    error_message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_decisions_date ON decisions(decision_date);
CREATE INDEX IF NOT EXISTS idx_decisions_issued ON decisions(issued_date);
CREATE INDEX IF NOT EXISTS idx_decisions_modified ON decisions(modified_date);
CREATE INDEX IF NOT EXISTS idx_decisions_court ON decisions(court_identifier);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_decisions_fetch_status ON decisions(fetch_status);
CREATE INDEX IF NOT EXISTS idx_decisions_court_date ON decisions(court_identifier, decision_date);
CREATE INDEX IF NOT EXISTS idx_decision_legal_areas_area ON decision_legal_areas(legal_area_identifier);

-- Full-text search (standalone, not content-synced - we manage it in code)
CREATE VIRTUAL TABLE IF NOT EXISTS decisions_fts USING fts5(
    ecli,
    title,
    summary,
    body_text,
    inhoudsindicatie
);
