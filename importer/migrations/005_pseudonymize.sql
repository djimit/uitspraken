-- Add anonymized body_text column for PII remediation
ALTER TABLE decisions ADD COLUMN body_text_anonymized TEXT;

-- Track PII remediation per decision
CREATE TABLE IF NOT EXISTS _pii_remediation (
    ecli TEXT PRIMARY KEY,
    violations_found INTEGER NOT NULL DEFAULT 0,
    violations_fixed INTEGER NOT NULL DEFAULT 0,
    remediation_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (ecli) REFERENCES decisions(ecli)
);

CREATE INDEX IF NOT EXISTS idx_pii_remediation_date ON _pii_remediation(remediation_at);
