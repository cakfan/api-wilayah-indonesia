import { writeFileSync, readFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

const BASE_URL = "https://wilayah.id/api";
const DATA_DIR = join(import.meta.dir, "..", "data", "raw");
const CHECKPOINT_FILE = join(DATA_DIR, "_checkpoint.json");

interface RegionData {
  code: string;
  name: string;
}

interface Checkpoint {
  provinces: { code: string; name: string }[];
  regencies: { code: string; province_code: string; name: string; type: "kabupaten" | "kota" }[];
  districts: { code: string; regency_code: string; name: string }[];
  villagesDone: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: T };
    return json.data;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

async function fetchWithRetry<T>(url: string, retries = 5): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchJson<T>(url);
    } catch (e: unknown) {
      if (i === retries - 1) throw e;
      const delay = 3000 * (i + 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

function determineVillageType(code: string): "kelurahan" | "desa" {
  const lastFour = parseInt(code.slice(-4), 10);
  return lastFour >= 2001 && lastFour <= 2099 ? "kelurahan" : "desa";
}

function determineRegencyType(name: string): "kabupaten" | "kota" {
  return name.startsWith("Kota ") ? "kota" : "kabupaten";
}

function saveCheckpoint(cp: Checkpoint) {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp));
}

function loadCheckpoint(): Checkpoint | null {
  if (!existsSync(CHECKPOINT_FILE)) return null;
  return JSON.parse(readFileSync(CHECKPOINT_FILE, "utf-8")) as Checkpoint;
}

async function main() {
  const start = Date.now();
  let cp = loadCheckpoint();

  if (cp && cp.provinces.length > 0 && cp.regencies.length > 0 && cp.districts.length > 0) {
    console.log(`Resuming from checkpoint: ${cp.villagesDone}/${cp.districts.length} districts' villages done`);
  } else {
    console.log("1. Fetching provinces...");
    const rawProvinces = await fetchWithRetry<RegionData[]>(`${BASE_URL}/provinces.json`);
    const provinces = rawProvinces.map((p) => ({ code: p.code, name: p.name.toUpperCase() }));
    console.log(`   ${provinces.length} provinces`);

    console.log("2. Fetching all regencies...");
    const allRegencies: Checkpoint["regencies"] = [];
    for (let i = 0; i < provinces.length; i++) {
      const p = provinces[i];
      process.stdout.write(`  [${i + 1}/${provinces.length}] ${p.name}\r`);
      const regencies = await fetchWithRetry<RegionData[]>(`${BASE_URL}/regencies/${p.code}.json`);
      for (const r of regencies) {
        allRegencies.push({
          code: r.code, province_code: p.code,
          name: r.name.toUpperCase(), type: determineRegencyType(r.name),
        });
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    console.log(`\n   ${allRegencies.length} regencies`);

    console.log("3. Fetching all districts...");
    const allDistricts: Checkpoint["districts"] = [];
    for (let i = 0; i < allRegencies.length; i++) {
      const reg = allRegencies[i];
      process.stdout.write(`  [${i + 1}/${allRegencies.length}] ${reg.name}\r`);
      const districts = await fetchWithRetry<RegionData[]>(`${BASE_URL}/districts/${reg.code}.json`);
      for (const d of districts) {
        allDistricts.push({ code: d.code, regency_code: reg.code, name: d.name.toUpperCase() });
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    console.log(`\n   ${allDistricts.length} districts`);

    cp = { provinces, regencies: allRegencies, districts: allDistricts, villagesDone: 0 };
    saveCheckpoint(cp);

    writeFileSync(join(DATA_DIR, "provinces.json"), JSON.stringify(provinces, null, 2));
    writeFileSync(join(DATA_DIR, "regencies.json"), JSON.stringify(allRegencies, null, 2));
    writeFileSync(join(DATA_DIR, "districts.json"), JSON.stringify(allDistricts, null, 2));
    console.log("   Saved provinces, regencies, districts");
  }

  const allDistricts = cp.districts;
  console.log(`\n4. Fetching villages (${cp.villagesDone}/${allDistricts.length})...`);

  const villageFilePath = join(DATA_DIR, "villages.json");
  let allVillages: { code: string; district_code: string; name: string; type: "kelurahan" | "desa" }[] = [];

  if (cp.villagesDone > 0 && existsSync(villageFilePath)) {
    allVillages = JSON.parse(readFileSync(villageFilePath, "utf-8"));
    console.log(`   Loaded ${allVillages.length} existing villages`);
  }

  for (let i = cp.villagesDone; i < allDistricts.length; i++) {
    const d = allDistricts[i];
    try {
      const villages = await fetchWithRetry<RegionData[]>(`${BASE_URL}/villages/${d.code}.json`);
      for (const v of villages) {
        allVillages.push({
          code: v.code, district_code: d.code,
          name: v.name.toUpperCase(), type: determineVillageType(v.code),
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`\n  Failed: ${d.code} ${d.name}: ${msg}`);
      const villages = await fetchWithRetry<RegionData[]>(`${BASE_URL}/villages/${d.code}.json`);
      for (const v of villages) {
        allVillages.push({
          code: v.code, district_code: d.code,
          name: v.name.toUpperCase(), type: determineVillageType(v.code),
        });
      }
    }

    cp.villagesDone = i + 1;
    if (cp.villagesDone % 50 === 0 || cp.villagesDone >= allDistricts.length) {
      process.stdout.write(`  ${cp.villagesDone}/${allDistricts.length} (${allVillages.length} villages)\n`);
      writeFileSync(villageFilePath, JSON.stringify(allVillages, null, 2));
      saveCheckpoint(cp);
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  writeFileSync(villageFilePath, JSON.stringify(allVillages, null, 2));

  if (existsSync(CHECKPOINT_FILE)) unlinkSync(CHECKPOINT_FILE);

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log(`\n\nDone in ${elapsed}s!`);
  console.log(`${cp.provinces.length} provinces, ${cp.regencies.length} regencies, ${allDistricts.length} districts, ${allVillages.length} villages`);
}

main().catch(console.error);
