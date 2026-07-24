import { Database } from "bun:sqlite";
import { join } from "path";

const DB_PATH = join(import.meta.dir, "..", "data", "db", "regions.sqlite");

function seedCheck() {
  const db = new Database(DB_PATH, { readonly: true });

  console.log("Seed check — row counts per table:\n");

  const provinceCount = db.query("SELECT COUNT(*) as cnt FROM provinces").get() as { cnt: number };
  const regencyCount = db.query("SELECT COUNT(*) as cnt FROM regencies").get() as { cnt: number };
  const districtCount = db.query("SELECT COUNT(*) as cnt FROM districts").get() as { cnt: number };
  const villageCount = db.query("SELECT COUNT(*) as cnt FROM villages").get() as { cnt: number };

  console.log(`  Provinces:  ${provinceCount.cnt}`);
  console.log(`  Regencies:  ${regencyCount.cnt}`);
  console.log(`  Districts:  ${districtCount.cnt}`);
  console.log(`  Villages:   ${villageCount.cnt}`);

  // Additional checks
  const villagesWithPostal = db
    .query("SELECT COUNT(*) as cnt FROM villages WHERE postal_code IS NOT NULL")
    .get() as { cnt: number };
  const villagesWithLatLng = db
    .query("SELECT COUNT(*) as cnt FROM villages WHERE latitude IS NOT NULL AND longitude IS NOT NULL")
    .get() as { cnt: number };

  console.log(`\n  Villages with postal code: ${villagesWithPostal.cnt}/${villageCount.cnt}`);
  console.log(`  Villages with lat/lng:     ${villagesWithLatLng.cnt}/${villageCount.cnt}`);

  db.close();
}

seedCheck();
