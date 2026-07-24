import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const RAW_DIR = join(import.meta.dir, "..", "data", "raw");
const BASE_URL = "https://raw.githubusercontent.com/open-admin-data/indonesia-administrative-divisions/main/data";

interface OpenAdminVillage {
  id: string;
  name: { local: string; en: string };
  parent: { id: string; name: { local: string } };
  ancestors: { id: string; level: number; name: { local: string } }[];
  zip_codes: string[];
  geo: { lat: string; lon: string };
}

interface OurVillage {
  code: string;
  district_code: string;
  name: string;
  type: string;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

function normalize(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
}

function readJson<T>(filename: string): T[] {
  return JSON.parse(readFileSync(join(RAW_DIR, filename), "utf-8")) as T[];
}

const PROVINCE_MAP: Record<string, string> = {
  "11": "aceh-11", "12": "north-sumatra-12", "13": "west-sumatra-13",
  "14": "riau-14", "15": "jambi-15", "16": "south-sumatra-16",
  "17": "bengkulu-17", "18": "lampung-18", "19": "bangka-belitung-islands-19",
  "21": "riau-islands-21", "31": "jakarta-31", "32": "west-java-32",
  "33": "central-java-33", "34": "yogyakarta-34", "35": "east-java-35",
  "36": "banten-36", "51": "bali-51", "52": "west-nusa-tenggara-52",
  "53": "east-nusa-tenggara-53", "61": "west-kalimantan-61",
  "62": "central-kalimantan-62", "63": "south-kalimantan-63",
  "64": "east-kalimantan-64", "65": "north-kalimantan-65",
  "71": "north-sulawesi-71", "72": "central-sulawesi-72",
  "73": "south-sulawesi-73", "74": "southeast-sulawesi-74",
  "75": "gorontalo-75", "76": "west-sulawesi-76",
  "81": "maluku-81", "82": "north-maluku-82",
  "91": "west-papua-91", "92": "papua-92", "93": "south-papua-93",
  "94": "papua-94", "95": "highland-papua-95", "96": "southwest-papua-96",
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return await response.json() as T;
}

async function main() {
  console.log("Enriching villages with postal codes + coordinates...\n");

  const villages = readJson<OurVillage>("villages.json");

  const districts = readJson<{ code: string; regency_code: string; name: string }>("districts.json");
  const regencies = readJson<{ code: string; province_code: string; name: string }>("regencies.json");

  const districtToProvince = new Map<string, string>();
  for (const d of districts) {
    const r = regencies.find((rr) => rr.code === d.regency_code);
    if (r) districtToProvince.set(d.code, r.province_code);
  }

  const provinceCodes = [...new Set(districts.map((d) => districtToProvince.get(d.code)).filter(Boolean))] as string[];

  const oaLookup = new Map<string, { postal: string | null; lat: number | null; lon: number | null }>();

  for (const pc of provinceCodes) {
    const slug = PROVINCE_MAP[pc];
    if (!slug) {
      console.warn(`  No slug mapping for province ${pc}, skipping`);
      continue;
    }

    console.log(`  Fetching ${slug}...`);
    try {
      const villages_data = await fetchJson<OpenAdminVillage[]>(`${BASE_URL}/village-by-province/${slug}.json`);
      for (const v of villages_data) {
        const districtName = v.parent?.name?.local ?? "";
        const villageName = v.name?.local ?? "";
        const key = `${normalize(districtName)}|${normalize(villageName)}`;
        const postal = v.zip_codes?.[0] ?? null;
        const lat = v.geo?.lat ? parseFloat(v.geo.lat) : null;
        const lon = v.geo?.lon ? parseFloat(v.geo.lon) : null;
        oaLookup.set(key, {
          postal,
          lat: lat && !isNaN(lat) ? lat : null,
          lon: lon && !isNaN(lon) ? lon : null,
        });
      }
    } catch (e) {
      console.error(`  Failed to fetch ${slug}: ${e}`);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nOpen-admin-data lookup: ${oaLookup.size} entries`);

  let matched = 0;
  let postalFilled = 0;
  let coordFilled = 0;

  for (const v of villages) {
    const d = districts.find((dd) => dd.code === v.district_code);
    if (!d) continue;

    const key = `${normalize(d.name)}|${normalize(v.name)}`;
    const oa = oaLookup.get(key);
    if (!oa) continue;

    matched++;

    if (!v.postal_code && oa.postal) {
      v.postal_code = oa.postal;
      postalFilled++;
    }
    if ((v.latitude == null || v.longitude == null) && oa.lat != null && oa.lon != null) {
      v.latitude = oa.lat;
      v.longitude = oa.lon;
      coordFilled++;
    }
  }

  console.log(`\nMatched: ${matched}/${villages.length} (${(matched / villages.length * 100).toFixed(1)}%)`);
  console.log(`Postal codes filled: ${postalFilled}`);
  console.log(`Coordinates filled: ${coordFilled}`);

  writeFileSync(join(RAW_DIR, "villages.json"), JSON.stringify(villages, null, 2));
  console.log(`\nUpdated villages.json`);
}

main().catch(console.error);
