import { Database } from "bun:sqlite";
import { mkdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const DB_DIR = join(import.meta.dir, "..", "data", "db");
const RAW_DIR = join(import.meta.dir, "..", "data", "raw");
const DB_PATH = join(DB_DIR, "regions.sqlite");

function readJson<T>(filename: string): T[] {
  const content = readFileSync(join(RAW_DIR, filename), "utf-8");
  return JSON.parse(content) as T[];
}

interface Province {
  code: string;
  name: string;
}

interface Regency {
  code: string;
  province_code: string;
  name: string;
  type: "kabupaten" | "kota";
}

interface District {
  code: string;
  regency_code: string;
  name: string;
}

interface Village {
  code: string;
  district_code: string;
  name: string;
  type: "kelurahan" | "desa";
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS provinces (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS regencies (
    code TEXT PRIMARY KEY,
    province_code TEXT NOT NULL REFERENCES provinces(code),
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('kabupaten', 'kota'))
  );

  CREATE TABLE IF NOT EXISTS districts (
    code TEXT PRIMARY KEY,
    regency_code TEXT NOT NULL REFERENCES regencies(code),
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS villages (
    code TEXT PRIMARY KEY,
    district_code TEXT NOT NULL REFERENCES districts(code),
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('kelurahan', 'desa')),
    postal_code TEXT,
    latitude REAL,
    longitude REAL
  );

  CREATE INDEX IF NOT EXISTS idx_regencies_province ON regencies(province_code);
  CREATE INDEX IF NOT EXISTS idx_districts_regency ON districts(regency_code);
  CREATE INDEX IF NOT EXISTS idx_villages_district ON villages(district_code);
  CREATE INDEX IF NOT EXISTS idx_villages_postal ON villages(postal_code);
`;

const FTS_SCHEMA = `
  CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
    entity_type,
    entity_code,
    name,
    province_code,
    regency_code,
    district_code,
    regency_type,
    village_type
  );
`;

function build() {
  console.log("Building regions.sqlite...");

  mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);

  db.exec("PRAGMA journal_mode=DELETE");
  db.exec("PRAGMA foreign_keys=ON");

  console.log("Creating schema...");
  db.exec("DROP TABLE IF EXISTS search_index");
  db.exec("DROP TABLE IF EXISTS villages");
  db.exec("DROP TABLE IF EXISTS districts");
  db.exec("DROP TABLE IF EXISTS regencies");
  db.exec("DROP TABLE IF EXISTS provinces");
  db.exec(SCHEMA);

  const provinces = readJson<Province>("provinces.json");
  const regencies = readJson<Regency>("regencies.json");
  const districts = readJson<District>("districts.json");
  const villagesFile = existsSync(join(RAW_DIR, "villages.json"))
    ? "villages.json"
    : "villages-postal-latlng.json";
  console.log(`Reading villages from ${villagesFile}...`);
  const villages = readJson<Village>(villagesFile);

  console.log(`Inserting ${provinces.length} provinces...`);
  const insertProvince = db.prepare("INSERT INTO provinces (code, name) VALUES (?, ?)");
  for (const p of provinces) {
    insertProvince.run(p.code, p.name);
  }

  console.log(`Inserting ${regencies.length} regencies...`);
  const insertRegency = db.prepare(
    "INSERT INTO regencies (code, province_code, name, type) VALUES (?, ?, ?, ?)"
  );
  for (const r of regencies) {
    insertRegency.run(r.code, r.province_code, r.name, r.type);
  }

  console.log(`Inserting ${districts.length} districts...`);
  const insertDistrict = db.prepare(
    "INSERT INTO districts (code, regency_code, name) VALUES (?, ?, ?)"
  );
  for (const d of districts) {
    insertDistrict.run(d.code, d.regency_code, d.name);
  }

  console.log(`Inserting ${villages.length} villages...`);
  const insertVillage = db.prepare(
    "INSERT INTO villages (code, district_code, name, type, postal_code, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  for (const v of villages) {
    insertVillage.run(v.code, v.district_code, v.name, v.type, v.postal_code ?? null, v.latitude ?? null, v.longitude ?? null);
  }

  console.log("Creating FTS tables...");
  db.exec(FTS_SCHEMA);

  console.log("Populating FTS search index...");
  db.exec(`
    INSERT INTO search_index(entity_type, entity_code, name, province_code, regency_code, district_code, regency_type, village_type)
    SELECT 'provinsi', code, name, code, NULL, NULL, NULL, NULL FROM provinces
  `);
  db.exec(`
    INSERT INTO search_index(entity_type, entity_code, name, province_code, regency_code, district_code, regency_type, village_type)
    SELECT 'regency', r.code, r.name, r.province_code, r.code, NULL, r.type, NULL FROM regencies r
  `);
  db.exec(`
    INSERT INTO search_index(entity_type, entity_code, name, province_code, regency_code, district_code, regency_type, village_type)
    SELECT 'district', d.code, d.name, r.province_code, d.regency_code, d.code, r.type, NULL FROM districts d
      JOIN regencies r ON d.regency_code = r.code
  `);
  db.exec(`
    INSERT INTO search_index(entity_type, entity_code, name, province_code, regency_code, district_code, regency_type, village_type)
    SELECT 'village', v.code, v.name, r.province_code, d.regency_code, v.district_code, r.type, v.type
      FROM villages v
      JOIN districts d ON v.district_code = d.code
      JOIN regencies r ON d.regency_code = r.code
  `);

  db.close();

  console.log(`Done! Database written to ${DB_PATH}`);
}

build();
