-- Formal relations reference table
CREATE TABLE IF NOT EXISTS formal_relations (
    identifier TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    label_eerdere_aanleg TEXT,
    label_latere_aanleg TEXT
);

-- Formal relation role players
CREATE TABLE IF NOT EXISTS formal_relation_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    relation_identifier TEXT NOT NULL,
    instantie_latere_aanleg TEXT,
    instantie_eerdere_aanleg TEXT,
    FOREIGN KEY (relation_identifier) REFERENCES formal_relations(identifier)
);

-- Foreign courts (extends courts table, but tracked separately for clarity)
-- These use the same courts table with type='BuitenlandseInstantie'

-- Non-Dutch decisions with Dutch references
CREATE TABLE IF NOT EXISTS non_dutch_decisions (
    ecli TEXT PRIMARY KEY,
    ljn TEXT
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_formal_relation_roles_rel ON formal_relation_roles(relation_identifier);
CREATE INDEX IF NOT EXISTS idx_non_dutch_decisions_ljn ON non_dutch_decisions(ljn);
