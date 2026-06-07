#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dashboardRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const queriesPath = join(dashboardRoot, "src/lib/queries.ts");
const publicDecisionRoutePath = join(dashboardRoot, "src/app/decisions/[ecli]/page.tsx");

const checks = [
  {
    path: queriesPath,
    pattern: /COALESCE\s*\(\s*body_text_anonymized\s*,\s*body_text\s*\)/i,
    message: "public_body_text must not fall back to raw body_text",
  },
  {
    path: queriesPath,
    pattern: /body_text\s+AS\s+public_body_text/i,
    message: "public_body_text must not alias raw body_text",
  },
  {
    path: publicDecisionRoutePath,
    pattern: /decision\.body_text\b/,
    message: "public decision route must not render raw body_text",
  },
];

const failures = [];

for (const check of checks) {
  const source = readFileSync(check.path, "utf8");
  if (check.pattern.test(source)) {
    failures.push(`${check.path}: ${check.message}`);
  }
}

if (failures.length > 0) {
  console.error("Public privacy regression check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Public privacy regression check passed.");
