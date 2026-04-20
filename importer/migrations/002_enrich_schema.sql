-- Migration 002: Enrich schema with all metadata from Open Data XSD
-- Adds: alternative_title, court_division, spatial, temporal, public_url,
--       replaces/isReplacedBy, contributors (judges), references (law citations),
--       vindplaatsen (publication venues), and relation outcomes (gevolg)

-- New columns on decisions table
ALTER TABLE decisions ADD COLUMN alternative_title TEXT;
ALTER TABLE decisions ADD COLUMN court_division TEXT;
ALTER TABLE decisions ADD COLUMN spatial TEXT;
ALTER TABLE decisions ADD COLUMN temporal_start TEXT;
ALTER TABLE decisions ADD COLUMN temporal_end TEXT;
ALTER TABLE decisions ADD COLUMN public_url TEXT;
ALTER TABLE decisions ADD COLUMN replaces TEXT;
ALTER TABLE decisions ADD COLUMN is_replaced_by TEXT;
ALTER TABLE decisions ADD COLUMN access_rights TEXT DEFAULT 'public';

-- Add gevolg (outcome) to decision_relations
ALTER TABLE decision_relations ADD COLUMN relation_gevolg TEXT;

-- Contributors (judges/raadsheren) - many per decision
CREATE TABLE IF NOT EXISTS decision_contributors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ecli TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    UNIQUE(ecli, name)
);
CREATE INDEX IF NOT EXISTS idx_decision_contributors_ecli ON decision_contributors(ecli);
CREATE INDEX IF NOT EXISTS idx_decision_contributors_name ON decision_contributors(name);

-- Law references (wetsverwijzingen: BWB, EU, ECLI citations)
CREATE TABLE IF NOT EXISTS decision_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ecli TEXT NOT NULL,
    reference_type TEXT,
    identifier TEXT,
    label TEXT
);
CREATE INDEX IF NOT EXISTS idx_decision_references_ecli ON decision_references(ecli);
CREATE INDEX IF NOT EXISTS idx_decision_references_identifier ON decision_references(identifier);

-- Vindplaatsen (publication venues: NJ, AB, JOR etc.)
CREATE TABLE IF NOT EXISTS decision_vindplaatsen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ecli TEXT NOT NULL,
    vindplaats TEXT NOT NULL,
    UNIQUE(ecli, vindplaats)
);
CREATE INDEX IF NOT EXISTS idx_decision_vindplaatsen_ecli ON decision_vindplaatsen(ecli);

-- Additional useful indexes
CREATE INDEX IF NOT EXISTS idx_decisions_alternative_title ON decisions(alternative_title) WHERE alternative_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decisions_spatial ON decisions(spatial) WHERE spatial IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decisions_procedure ON decisions(procedure_type);
CREATE INDEX IF NOT EXISTS idx_decision_relations_ecli ON decision_relations(ecli);
CREATE INDEX IF NOT EXISTS idx_decision_relations_related ON decision_relations(related_ecli);
