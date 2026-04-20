import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath =
      process.env.DATABASE_PATH ||
      path.join(process.cwd(), "..", "data", "rechtspraak.db");
    db = new Database(dbPath, { readonly: true });
    db.pragma("journal_mode = WAL");
    db.pragma("cache_size = -64000");    // 64 MB page cache (default is 2 MB)
    db.pragma("mmap_size = 268435456");  // 256 MB memory-mapped I/O
    db.pragma("temp_store = MEMORY");    // temp tables in RAM
  }
  return db;
}

// ── In-process query cache ──────────────────────────────────────────
// Survives across requests in the same Node.js process.
// Uses globalThis to survive Turbopack module reloads in dev.

interface CacheEntry<T> { data: T; ts: number }

const CACHE_TTL_DEFAULT = 60_000;  // 1 minute for normal queries
const CACHE_TTL_SLOW = 300_000;    // 5 minutes for expensive queries

function getCache(): Map<string, CacheEntry<unknown>> {
  const g = globalThis as Record<string, unknown>;
  if (!g.__queryCache) g.__queryCache = new Map();
  return g.__queryCache as Map<string, CacheEntry<unknown>>;
}

/** Cache a function result by key for the default TTL */
export function cached<T>(key: string, fn: () => T): T {
  return cachedWithTTL(key, CACHE_TTL_DEFAULT, fn);
}

/** Cache a function result by key for a slow/expensive query TTL (5 min) */
export function cachedSlow<T>(key: string, fn: () => T): T {
  return cachedWithTTL(key, CACHE_TTL_SLOW, fn);
}

/** Cache a function result by key for a specific TTL */
function cachedWithTTL<T>(key: string, ttl: number, fn: () => T): T {
  const cache = getCache();
  const existing = cache.get(key);
  if (existing && Date.now() - existing.ts < ttl) {
    return existing.data as T;
  }
  const data = fn();
  cache.set(key, { data, ts: Date.now() });
  return data;
}
