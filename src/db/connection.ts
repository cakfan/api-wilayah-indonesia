import { Database } from "bun:sqlite";
import { existsSync } from "fs";
import { join } from "path";

function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;

  const candidates = [
    import.meta.dir && join(import.meta.dir, "..", "..", "data", "db", "regions.sqlite"),
    join(process.cwd(), "data", "db", "regions.sqlite"),
  ];

  for (const p of candidates) {
    if (p && existsSync(p)) return p;
  }

  return candidates[candidates.length - 1]!;
}

const DB_PATH = resolveDbPath();

let db: Database;

export function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
  }
  return db;
}
