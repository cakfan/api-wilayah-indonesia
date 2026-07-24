import { Database } from "bun:sqlite";
import { readFileSync } from "fs";
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
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
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
  CREATE VIRTUAL TABLE IF NOT EXISTS villages_fts USING fts5(
    name,
    content='villages',
    content_rowid='rowid'
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS regencies_fts USING fts5(
    name,
    content='regencies',
    content_rowid='rowid'
  );
`;

function build() {
  console.log("Building regions.sqlite...");

  const db = new Database(DB_PATH);

  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");

  console.log("Creating schema...");
  db.exec("DROP TABLE IF EXISTS villages_fts");
  db.exec("DROP TABLE IF EXISTS regencies_fts");
  db.exec("DROP TABLE IF EXISTS villages");
  db.exec("DROP TABLE IF EXISTS districts");
  db.exec("DROP TABLE IF EXISTS regencies");
  db.exec("DROP TABLE IF EXISTS provinces");
  db.exec(SCHEMA);

  const provinces = readJson<Province>("provinces.json");
  const regencies = readJson<Regency>("regencies.json");
  const districts = readJson<District>("districts.json");
  const villages = readJson<Village>("villages-postal-latlng.json");

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
    insertVillage.run(v.code, v.district_code, v.name, v.type, v.postal_code, v.latitude, v.longitude);
  }

  console.log("Creating FTS tables...");
  db.exec(FTS_SCHEMA);

  console.log("Populating FTS index...");
  db.exec("INSERT INTO villages_fts(villages_fts) VALUES('rebuild')");
  db.exec("INSERT INTO regencies_fts(regencies_fts) VALUES('rebuild')");

  db.close();

  console.log(`Done! Database written to ${DB_PATH}`);
}

build();
