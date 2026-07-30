import type { Database } from "bun:sqlite";
import { getDb } from "@/db/connection";
import type { Province, Regency, District, Village } from "@/types/region.types";
import { getOffset } from "@/lib/pagination";
import { logger } from "@/lib/logger";

const SLOW_QUERY_MS = 100;

function timedQuery<T>(db: Database, sql: string, ...params: unknown[]): T {
  const start = performance.now();
  const result = db.query(sql).all(...params) as T;
  const duration = performance.now() - start;
  if (duration > SLOW_QUERY_MS) {
    logger.warn({ sql: sql.slice(0, 200), duration: Math.round(duration) }, "Slow query");
  }
  return result;
}

function timedGet<T>(db: Database, sql: string, ...params: unknown[]): T {
  const start = performance.now();
  const result = db.query(sql).get(...params) as T;
  const duration = performance.now() - start;
  if (duration > SLOW_QUERY_MS) {
    logger.warn({ sql: sql.slice(0, 200), duration: Math.round(duration) }, "Slow query");
  }
  return result;
}

function createRepository(dbFactory: () => Database) {
  return {
    findAllProvinces(): Province[] {
      return timedQuery<Province[]>(dbFactory(), "SELECT code, name FROM provinces ORDER BY code");
    },

    findProvinceByCode(code: string): Province | undefined {
      return timedGet<Province | undefined>(dbFactory(), "SELECT code, name FROM provinces WHERE code = ?", code);
    },

    findRegenciesByProvince(provinceCode: string, page: number, limit: number): { data: Regency[]; total: number } {
      const offset = getOffset(page, limit);
      const db = dbFactory();
      const data = timedQuery<Regency[]>(db, "SELECT code, province_code, name, type FROM regencies WHERE province_code = ? ORDER BY code LIMIT ? OFFSET ?", provinceCode, limit, offset);
      const { total } = timedGet<{ total: number }>(db, "SELECT COUNT(*) as total FROM regencies WHERE province_code = ?", provinceCode);
      return { data, total };
    },

    findRegencyByCode(code: string): Regency | undefined {
      return timedGet<Regency | undefined>(dbFactory(), "SELECT code, province_code, name, type FROM regencies WHERE code = ?", code);
    },

    findDistrictsByRegency(regencyCode: string, page: number, limit: number): { data: District[]; total: number } {
      const offset = getOffset(page, limit);
      const db = dbFactory();
      const data = timedQuery<District[]>(db, "SELECT code, regency_code, name FROM districts WHERE regency_code = ? ORDER BY code LIMIT ? OFFSET ?", regencyCode, limit, offset);
      const { total } = timedGet<{ total: number }>(db, "SELECT COUNT(*) as total FROM districts WHERE regency_code = ?", regencyCode);
      return { data, total };
    },

    findDistrictByCode(code: string): District | undefined {
      return timedGet<District | undefined>(dbFactory(), "SELECT code, regency_code, name FROM districts WHERE code = ?", code);
    },

    findVillagesByDistrict(districtCode: string, page: number, limit: number): { data: Village[]; total: number } {
      const offset = getOffset(page, limit);
      const db = dbFactory();
      const data = timedQuery<Village[]>(db, "SELECT code, district_code, name, type, postal_code, latitude, longitude FROM villages WHERE district_code = ? ORDER BY code LIMIT ? OFFSET ?", districtCode, limit, offset);
      const { total } = timedGet<{ total: number }>(db, "SELECT COUNT(*) as total FROM villages WHERE district_code = ?", districtCode);
      return { data, total };
    },

    findVillageByCode(code: string): Village | undefined {
      return timedGet<Village | undefined>(dbFactory(), "SELECT code, district_code, name, type, postal_code, latitude, longitude FROM villages WHERE code = ?", code);
    },

    searchRegions(q: string, type: string | undefined, page: number, limit: number): { data: (Province | Regency | District | Village)[]; total: number } {
      const offset = getOffset(page, limit);
      const db = dbFactory();

      let typeCondition = "";

      if (type) {
        if (type === "provinsi") {
          typeCondition = "AND si.entity_type = 'provinsi'";
        } else if (type === "kabupaten") {
          typeCondition = "AND si.entity_type = 'regency' AND si.regency_type = 'kabupaten'";
        } else if (type === "kota") {
          typeCondition = "AND si.entity_type = 'regency' AND si.regency_type = 'kota'";
        } else if (type === "kecamatan") {
          typeCondition = "AND si.entity_type = 'district'";
        } else if (type === "kelurahan") {
          typeCondition = "AND si.entity_type = 'village' AND si.village_type = 'kelurahan'";
        } else if (type === "desa") {
          typeCondition = "AND si.entity_type = 'village' AND si.village_type = 'desa'";
        }
      }

      const countQuery = `
        SELECT COUNT(*) as total
        FROM search_index si
        WHERE search_index MATCH ?
        ${typeCondition}
      `;

      const { total } = timedGet<{ total: number }>(db, countQuery, q);

      const dataQuery = `
        SELECT
          si.entity_type,
          si.entity_code as code,
          si.name,
          si.province_code,
          si.regency_code,
          si.district_code,
          si.regency_type,
          si.village_type,
          v.postal_code,
          v.latitude,
          v.longitude
        FROM search_index si
        LEFT JOIN villages v ON si.entity_type = 'village' AND si.entity_code = v.code
        WHERE search_index MATCH ?
        ${typeCondition}
        ORDER BY rank
        LIMIT ? OFFSET ?
      `;

      const rows = timedQuery<Array<{
        entity_type: string;
        code: string;
        name: string;
        province_code: string | null;
        regency_code: string | null;
        district_code: string | null;
        regency_type: string | null;
        village_type: string | null;
        postal_code: string | null;
        latitude: number | null;
        longitude: number | null;
      }>>(db, dataQuery, q, limit, offset);

      const data: (Province | Regency | District | Village)[] = rows.map((r) => {
        switch (r.entity_type) {
          case "provinsi":
            return { code: r.code, name: r.name };
          case "regency":
            return { code: r.code, province_code: r.province_code ?? "", name: r.name, type: r.regency_type as "kabupaten" | "kota" };
          case "district":
            return { code: r.code, regency_code: r.regency_code ?? "", name: r.name };
          case "village":
            return { code: r.code, district_code: r.district_code ?? "", name: r.name, type: r.village_type as "kelurahan" | "desa", postal_code: r.postal_code, latitude: r.latitude, longitude: r.longitude };
          default:
            return { code: r.code, name: r.name };
        }
      });

      return { data, total };
    },

    findVillagesByPostalCode(postalCode: string, page: number, limit: number): { data: Village[]; total: number } {
      const offset = getOffset(page, limit);
      const db = dbFactory();
      const data = timedQuery<Village[]>(db, "SELECT code, district_code, name, type, postal_code, latitude, longitude FROM villages WHERE postal_code = ? ORDER BY code LIMIT ? OFFSET ?", postalCode, limit, offset);
      const { total } = timedGet<{ total: number }>(db, "SELECT COUNT(*) as total FROM villages WHERE postal_code = ?", postalCode);
      return { data, total };
    },
  };
}

export const regionRepository = createRepository(getDb);

export { createRepository };
