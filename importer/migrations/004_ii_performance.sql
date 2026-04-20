-- Migration 004: Performance optimizations for inhoudsindicatie analysis
-- Adds pre-computed columns and a cache table to avoid expensive full-table scans.

-- 1. Add pre-computed body_text_length to avoid LENGTH(body_text) scans
ALTER TABLE decisions ADD COLUMN body_text_length INTEGER;

-- Backfill existing data
UPDATE decisions
SET body_text_length = LENGTH(body_text)
WHERE fetch_status = 'fetched' AND body_text IS NOT NULL;

-- 2. Create cache table for expensive inhoudsindicatie analysis
CREATE TABLE IF NOT EXISTS _ii_analysis_cache (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);
