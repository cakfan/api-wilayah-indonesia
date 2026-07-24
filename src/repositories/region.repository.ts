import { Database } from "bun:sqlite";
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

function createRepository(db: Database) {
  return {
    findAllProvinces(): Province[] {
      return timedQuery<Province[]>(db, "SELECT code, name FROM provinces ORDER BY code");
    },

    findProvinceByCode(code: string): Province | undefined {
      return timedGet<Province | undefined>(db, "SELECT code, name FROM provinces WHERE code = ?", code);
    },

    findRegenciesByProvince(provinceCode: string, page: number, limit: number): { data: Regency[]; total: number } {
      const offset = getOffset(page, limit);
      const data = timedQuery<Regency[]>(db, "SELECT code, province_code, name, type FROM regencies WHERE province_code = ? ORDER BY code LIMIT ? OFFSET ?", provinceCode, limit, offset);
      const { total } = timedGet<{ total: number }>(db, "SELECT COUNT(*) as total FROM regencies WHERE province_code = ?", provinceCode);
      return { data, total };
    },

    findRegencyByCode(code: string): Regency | undefined {
      return timedGet<Regency | undefined>(db, "SELECT code, province_code, name, type FROM regencies WHERE code = ?", code);
    },

    findDistrictsByRegency(regencyCode: string, page: number, limit: number): { data: District[]; total: number } {
      const offset = getOffset(page, limit);
      const data = timedQuery<District[]>(db, "SELECT code, regency_code, name FROM districts WHERE regency_code = ? ORDER BY code LIMIT ? OFFSET ?", regencyCode, limit, offset);
      const { total } = timedGet<{ total: number }>(db, "SELECT COUNT(*) as total FROM districts WHERE regency_code = ?", regencyCode);
      return { data, total };
    },

    findDistrictByCode(code: string): District | undefined {
      return timedGet<District | undefined>(db, "SELECT code, regency_code, name FROM districts WHERE code = ?", code);
    },

    findVillagesByDistrict(districtCode: string, page: number, limit: number): { data: Village[]; total: number } {
      const offset = getOffset(page, limit);
      const data = timedQuery<Village[]>(db, "SELECT code, district_code, name, type, postal_code, latitude, longitude FROM villages WHERE district_code = ? ORDER BY code LIMIT ? OFFSET ?", districtCode, limit, offset);
      const { total } = timedGet<{ total: number }>(db, "SELECT COUNT(*) as total FROM villages WHERE district_code = ?", districtCode);
      return { data, total };
    },

    findVillageByCode(code: string): Village | undefined {
      return timedGet<Village | undefined>(db, "SELECT code, district_code, name, type, postal_code, latitude, longitude FROM villages WHERE code = ?", code);
    },

    searchRegions(q: string, type: string | undefined, page: number, limit: number): { data: (Province | Regency | District | Village)[]; total: number } {
      const offset = getOffset(page, limit);

      const conditions: string[] = [];

      if (type) {
        if (type === "provinsi") {
          conditions.push("p.code IS NOT NULL");
        } else if (type === "kabupaten" || type === "kota") {
          conditions.push("r.code IS NOT NULL");
          if (type === "kabupaten") {
            conditions.push("r.type = 'kabupaten'");
          } else {
            conditions.push("r.type = 'kota'");
          }
        } else if (type === "kecamatan") {
          conditions.push("d.code IS NOT NULL");
        } else if (type === "kelurahan" || type === "desa") {
          conditions.push("v.code IS NOT NULL");
          if (type === "kelurahan") {
            conditions.push("v.type = 'kelurahan'");
          } else {
            conditions.push("v.type = 'desa'");
          }
        }
      }

      const whereClause = conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

      const searchQuery = `
        SELECT DISTINCT
          CASE
            WHEN p.code IS NOT NULL THEN 'provinsi'
            WHEN r.code IS NOT NULL AND r.type = 'kabupaten' THEN 'kabupaten'
            WHEN r.code IS NOT NULL AND r.type = 'kota' THEN 'kota'
            WHEN d.code IS NOT NULL THEN 'kecamatan'
            WHEN v.code IS NOT NULL AND v.type = 'kelurahan' THEN 'kelurahan'
            WHEN v.code IS NOT NULL AND v.type = 'desa' THEN 'desa'
          END as type,
          COALESCE(p.code, r.code, d.code, v.code) as code,
          COALESCE(p.name, r.name, d.name, v.name) as name,
          p.code as province_code,
          r.code as regency_code,
          d.code as district_code,
          r.type as regency_type,
          v.type as village_type,
          v.postal_code,
          v.latitude,
          v.longitude
        FROM villages v
        LEFT JOIN districts d ON v.district_code = d.code
        LEFT JOIN regencies r ON d.regency_code = r.code
        LEFT JOIN provinces p ON r.province_code = p.code
        WHERE (
          p.name LIKE ? OR
          r.name LIKE ? OR
          d.name LIKE ? OR
          v.name LIKE ?
        )
        ${whereClause}
        ORDER BY
          CASE
            WHEN p.name LIKE ? THEN 1
            WHEN r.name LIKE ? THEN 2
            WHEN d.name LIKE ? THEN 3
            WHEN v.name LIKE ? THEN 4
          END,
          COALESCE(p.name, r.name, d.name, v.name)
        LIMIT ? OFFSET ?
      `;

      const searchPattern = `%${q}%`;
      const countParams = [searchPattern, searchPattern, searchPattern, searchPattern];

      const countQuery = `
        SELECT COUNT(DISTINCT
          CASE
            WHEN p.code IS NOT NULL THEN 'provinsi:' || p.code
            WHEN r.code IS NOT NULL THEN 'regency:' || r.code
            WHEN d.code IS NOT NULL THEN 'district:' || d.code
            WHEN v.code IS NOT NULL THEN 'village:' || v.code
          END
        ) as total
        FROM villages v
        LEFT JOIN districts d ON v.district_code = d.code
        LEFT JOIN regencies r ON d.regency_code = r.code
        LEFT JOIN provinces p ON r.province_code = p.code
        WHERE (
          p.name LIKE ? OR
          r.name LIKE ? OR
          d.name LIKE ? OR
          v.name LIKE ?
        )
        ${whereClause}
      `;

      const { total } = timedGet<{ total: number }>(db, countQuery, ...countParams);

      const allParams = [
        ...countParams,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        limit,
        offset,
      ];

      const data = timedQuery<(Province | Regency | District | Village)[]>(db, searchQuery, ...allParams);

      return { data, total };
    },

    findVillagesByPostalCode(postalCode: string, page: number, limit: number): { data: Village[]; total: number } {
      const offset = getOffset(page, limit);
      const data = timedQuery<Village[]>(db, "SELECT code, district_code, name, type, postal_code, latitude, longitude FROM villages WHERE postal_code = ? ORDER BY code LIMIT ? OFFSET ?", postalCode, limit, offset);
      const { total } = timedGet<{ total: number }>(db, "SELECT COUNT(*) as total FROM villages WHERE postal_code = ?", postalCode);
      return { data, total };
    },
  };
}

export const regionRepository = createRepository(getDb());

export { createRepository };
