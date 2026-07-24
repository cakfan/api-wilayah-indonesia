import { Database } from "bun:sqlite";
import { readFileSync } from "fs";
import { join } from "path";

const RAW_DIR = join(import.meta.dir, "..", "data", "raw");

function readJson<T>(filename: string): T[] {
  return JSON.parse(readFileSync(join(RAW_DIR, filename), "utf-8")) as T[];
}

const SCHEMA = `
  CREATE TABLE provinces (code TEXT PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE regencies (code TEXT PRIMARY KEY, province_code TEXT NOT NULL REFERENCES provinces(code), name TEXT NOT NULL, type TEXT CHECK(type IN ('kabupaten', 'kota')));
  CREATE TABLE districts (code TEXT PRIMARY KEY, regency_code TEXT NOT NULL REFERENCES regencies(code), name TEXT NOT NULL);
  CREATE TABLE villages (code TEXT PRIMARY KEY, district_code TEXT NOT NULL REFERENCES districts(code), name TEXT NOT NULL, type TEXT CHECK(type IN ('kelurahan', 'desa')), postal_code TEXT, latitude REAL, longitude REAL);
  CREATE INDEX idx_regencies_province ON regencies(province_code);
  CREATE INDEX idx_districts_regency ON districts(regency_code);
  CREATE INDEX idx_villages_district ON villages(district_code);
  CREATE INDEX idx_villages_postal ON villages(postal_code);
`;

export function createTestDb(): Database {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  db.exec(SCHEMA);

  const provinces = readJson<{ code: string; name: string }>("provinces.json");
  const regencies = readJson<{ code: string; province_code: string; name: string; type: string }>("regencies.json");
  const districts = readJson<{ code: string; regency_code: string; name: string }>("districts.json");
  const villages = readJson<{ code: string; district_code: string; name: string; type: string; postal_code: string | null; latitude: number | null; longitude: number | null }>("villages-postal-latlng.json");

  const insP = db.prepare("INSERT INTO provinces (code, name) VALUES (?, ?)");
  for (const p of provinces) insP.run(p.code, p.name);

  const insR = db.prepare("INSERT INTO regencies (code, province_code, name, type) VALUES (?, ?, ?, ?)");
  for (const r of regencies) insR.run(r.code, r.province_code, r.name, r.type);

  const insD = db.prepare("INSERT INTO districts (code, regency_code, name) VALUES (?, ?, ?)");
  for (const d of districts) insD.run(d.code, d.regency_code, d.name);

  const insV = db.prepare("INSERT INTO villages (code, district_code, name, type, postal_code, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)");
  for (const v of villages) insV.run(v.code, v.district_code, v.name, v.type, v.postal_code, v.latitude, v.longitude);

  return db;
}
