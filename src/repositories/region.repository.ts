import { getDb } from "@/db/connection";
import type { Province, Regency, District, Village } from "@/types/region.types";
import { getOffset } from "@/lib/pagination";

export const regionRepository = {
  findAllProvinces(): Province[] {
    const db = getDb();
    return db.query("SELECT code, name FROM provinces ORDER BY code").all() as Province[];
  },

  findProvinceByCode(code: string): Province | undefined {
    const db = getDb();
    return db.query("SELECT code, name FROM provinces WHERE code = ?").get(code) as Province | undefined;
  },

  findRegenciesByProvince(provinceCode: string, page: number, limit: number): { data: Regency[]; total: number } {
    const db = getDb();
    const offset = getOffset(page, limit);
    const data = db
      .query("SELECT code, province_code, name, type FROM regencies WHERE province_code = ? ORDER BY code LIMIT ? OFFSET ?")
      .all(provinceCode, limit, offset) as Regency[];
    const { total } = db.query("SELECT COUNT(*) as total FROM regencies WHERE province_code = ?").get(provinceCode) as { total: number };
    return { data, total };
  },

  findRegencyByCode(code: string): Regency | undefined {
    const db = getDb();
    return db.query("SELECT code, province_code, name, type FROM regencies WHERE code = ?").get(code) as Regency | undefined;
  },

  findDistrictsByRegency(regencyCode: string, page: number, limit: number): { data: District[]; total: number } {
    const db = getDb();
    const offset = getOffset(page, limit);
    const data = db
      .query("SELECT code, regency_code, name FROM districts WHERE regency_code = ? ORDER BY code LIMIT ? OFFSET ?")
      .all(regencyCode, limit, offset) as District[];
    const { total } = db.query("SELECT COUNT(*) as total FROM districts WHERE regency_code = ?").get(regencyCode) as { total: number };
    return { data, total };
  },

  findDistrictByCode(code: string): District | undefined {
    const db = getDb();
    return db.query("SELECT code, regency_code, name FROM districts WHERE code = ?").get(code) as District | undefined;
  },

  findVillagesByDistrict(districtCode: string, page: number, limit: number): { data: Village[]; total: number } {
    const db = getDb();
    const offset = getOffset(page, limit);
    const data = db
      .query("SELECT code, district_code, name, type, postal_code, latitude, longitude FROM villages WHERE district_code = ? ORDER BY code LIMIT ? OFFSET ?")
      .all(districtCode, limit, offset) as Village[];
    const { total } = db.query("SELECT COUNT(*) as total FROM villages WHERE district_code = ?").get(districtCode) as { total: number };
    return { data, total };
  },

  findVillageByCode(code: string): Village | undefined {
    const db = getDb();
    return db
      .query("SELECT code, district_code, name, type, postal_code, latitude, longitude FROM villages WHERE code = ?")
      .get(code) as Village | undefined;
  },

  searchRegions(q: string, type: string | undefined, page: number, limit: number): { data: (Province | Regency | District | Village)[]; total: number } {
    const db = getDb();
    const offset = getOffset(page, limit);

    const conditions: string[] = [];
    const params: unknown[] = [];

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

    const { total } = db.query(countQuery).get(...countParams) as { total: number };

    const allParams = [
      ...countParams,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      ...params,
      limit,
      offset,
    ];

    const data = db.query(searchQuery).all(...allParams) as (Province | Regency | District | Village)[];

    return { data, total };
  },

  findVillagesByPostalCode(postalCode: string, page: number, limit: number): { data: Village[]; total: number } {
    const db = getDb();
    const offset = getOffset(page, limit);
    const data = db
      .query("SELECT code, district_code, name, type, postal_code, latitude, longitude FROM villages WHERE postal_code = ? ORDER BY code LIMIT ? OFFSET ?")
      .all(postalCode, limit, offset) as Village[];
    const { total } = db.query("SELECT COUNT(*) as total FROM villages WHERE postal_code = ?").get(postalCode) as { total: number };
    return { data, total };
  },
};
