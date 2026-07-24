import { Database } from "bun:sqlite";
import { join } from "path";

const DB_PATH = join(import.meta.dir, "..", "data", "db", "regions.sqlite");

interface ValidationResult {
  passed: boolean;
  errors: string[];
}

function validate(): ValidationResult {
  const result: ValidationResult = { passed: true, errors: [] };

  const db = new Database(DB_PATH, { readonly: true });

  console.log("Validating data integrity...\n");

  // 1. Check orphan regencies (regency without valid province)
  const orphanRegencies = db
    .query(
      `SELECT r.code, r.name FROM regencies r
       LEFT JOIN provinces p ON r.province_code = p.code
       WHERE p.code IS NULL`
    )
    .all() as { code: string; name: string }[];

  if (orphanRegencies.length > 0) {
    result.passed = false;
    for (const r of orphanRegencies) {
      result.errors.push(`Orphan regency: ${r.code} (${r.name}) has no valid province`);
    }
  }

  // 2. Check orphan districts (district without valid regency)
  const orphanDistricts = db
    .query(
      `SELECT d.code, d.name FROM districts d
       LEFT JOIN regencies r ON d.regency_code = r.code
       WHERE r.code IS NULL`
    )
    .all() as { code: string; name: string }[];

  if (orphanDistricts.length > 0) {
    result.passed = false;
    for (const d of orphanDistricts) {
      result.errors.push(`Orphan district: ${d.code} (${d.name}) has no valid regency`);
    }
  }

  // 3. Check orphan villages (village without valid district)
  const orphanVillages = db
    .query(
      `SELECT v.code, v.name FROM villages v
       LEFT JOIN districts d ON v.district_code = d.code
       WHERE d.code IS NULL`
    )
    .all() as { code: string; name: string }[];

  if (orphanVillages.length > 0) {
    result.passed = false;
    for (const v of orphanVillages) {
      result.errors.push(`Orphan village: ${v.code} (${v.name}) has no valid district`);
    }
  }

  // 4. Check duplicate codes
  const duplicateProvinces = db
    .query("SELECT code, COUNT(*) as cnt FROM provinces GROUP BY code HAVING cnt > 1")
    .all() as { code: string; cnt: number }[];

  for (const d of duplicateProvinces) {
    result.passed = false;
    result.errors.push(`Duplicate province code: ${d.code} (${d.cnt} entries)`);
  }

  const duplicateRegencies = db
    .query("SELECT code, COUNT(*) as cnt FROM regencies GROUP BY code HAVING cnt > 1")
    .all() as { code: string; cnt: number }[];

  for (const d of duplicateRegencies) {
    result.passed = false;
    result.errors.push(`Duplicate regency code: ${d.code} (${d.cnt} entries)`);
  }

  const duplicateDistricts = db
    .query("SELECT code, COUNT(*) as cnt FROM districts GROUP BY code HAVING cnt > 1")
    .all() as { code: string; cnt: number }[];

  for (const d of duplicateDistricts) {
    result.passed = false;
    result.errors.push(`Duplicate district code: ${d.code} (${d.cnt} entries)`);
  }

  const duplicateVillages = db
    .query("SELECT code, COUNT(*) as cnt FROM villages GROUP BY code HAVING cnt > 1")
    .all() as { code: string; cnt: number }[];

  for (const d of duplicateVillages) {
    result.passed = false;
    result.errors.push(`Duplicate village code: ${d.code} (${d.cnt} entries)`);
  }

  // 5. Check lat/lng range (Indonesia: lat -11 to 6, lng 95 to 141)
  const invalidLatLng = db
    .query(
      `SELECT code, name, latitude, longitude FROM villages
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       AND (latitude < -11 OR latitude > 6 OR longitude < 95 OR longitude > 141)`
    )
    .all() as { code: string; name: string; latitude: number; longitude: number }[];

  if (invalidLatLng.length > 0) {
    result.passed = false;
    for (const v of invalidLatLng) {
      result.errors.push(
        `Invalid lat/lng for village ${v.code} (${v.name}): ${v.latitude}, ${v.longitude}`
      );
    }
  }

  // 6. Check postal code format (5 digits if present)
  const allVillagesWithPostal = db
    .query(
      `SELECT code, name, postal_code FROM villages WHERE postal_code IS NOT NULL`
    )
    .all() as { code: string; name: string; postal_code: string }[];

  const invalidPostalCodes = allVillagesWithPostal.filter(
    (v) => !/^\d{5}$/.test(v.postal_code)
  );

  if (invalidPostalCodes.length > 0) {
    result.passed = false;
    for (const v of invalidPostalCodes) {
      result.errors.push(
        `Invalid postal code for village ${v.code} (${v.name}): ${v.postal_code}`
      );
    }
  }

  db.close();

  return result;
}

const result = validate();

if (result.passed) {
  console.log("All validations passed!");
  process.exit(0);
} else {
  console.error("Validation failed with errors:");
  for (const error of result.errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}
