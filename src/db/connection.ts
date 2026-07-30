import { Database } from "bun:sqlite";
import { existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { logger } from "../lib/logger";

function resolveDbPath(): string {
  if (process.env.DB_PATH) {
    logger.info({ dbPath: process.env.DB_PATH }, "Using DB_PATH from env");
    return process.env.DB_PATH;
  }

  const moduleDir = import.meta.dir ?? fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");

  logger.info({ moduleDir, cwd: process.cwd(), vercel: process.env.VERCEL }, "DB path resolution");

  const candidates = [
    join(moduleDir, "..", "..", "data", "db", "regions.sqlite"),
    join(process.cwd(), "data", "db", "regions.sqlite"),
  ];

  if (process.env.VERCEL === "1") {
    candidates.push(
      join("/var/task", "data", "db", "regions.sqlite"),
      join(process.cwd(), "..", "data", "db", "regions.sqlite"),
    );
  }

  for (const p of candidates) {
    if (p && existsSync(p)) {
      logger.info({ dbPath: p }, "Database found");
      return p;
    }
  }

  const fallback = candidates[0]!;
  logger.error({ candidates, fallback }, "Database file not found at any candidate path");
  return fallback;
}

const DB_PATH = resolveDbPath();

let db: Database;

export function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
  }
  return db;
}
