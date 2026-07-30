import { describe, it, expect, beforeAll } from "bun:test";
import { createTestDb } from "../helpers";
import { createRepository } from "../../src/repositories/region.repository";
import type { Database } from "bun:sqlite";

let db: Database;
let repo: ReturnType<typeof createRepository>;

beforeAll(() => {
  db = createTestDb();
  repo = createRepository(db);
});

describe("findAllProvinces", () => {
  it("should return all provinces", () => {
    const provinces = repo.findAllProvinces();
    expect(provinces.length).toBe(38);
  });

  it("should be sorted by code", () => {
    const provinces = repo.findAllProvinces();
    const codes = provinces.map((p) => p.code);
    expect(codes[0]).toBe("11");
    expect(codes[codes.length - 1]).toBe("96");
  });
});

describe("findProvinceByCode", () => {
  it("should return province by code", () => {
    const province = repo.findProvinceByCode("11");
    expect(province).toEqual({ code: "11", name: "ACEH" });
  });

  it("should return null for non-existent code", () => {
    const province = repo.findProvinceByCode("99");
    expect(province == null).toBe(true);
  });
});

describe("findRegenciesByProvince", () => {
  it("should return regencies for province 11", () => {
    const result = repo.findRegenciesByProvince("11", 1, 50);
    expect(result.data.length).toBe(23);
    expect(result.total).toBe(23);
  });

  it("should support pagination", () => {
    const result = repo.findRegenciesByProvince("11", 1, 2);
    expect(result.data.length).toBe(2);
    expect(result.total).toBe(23);
  });

  it("should return empty for non-existent province", () => {
    const result = repo.findRegenciesByProvince("99", 1, 50);
    expect(result.data.length).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe("findRegencyByCode", () => {
  it("should return regency by code", () => {
    const regency = repo.findRegencyByCode("11.01");
    expect(regency).toBeDefined();
    expect(regency?.name).toBe("KABUPATEN ACEH SELATAN");
    expect(regency?.type).toBe("kabupaten");
  });

  it("should return null for non-existent code", () => {
    const regency = repo.findRegencyByCode("99.99");
    expect(regency == null).toBe(true);
  });
});

describe("findDistrictsByRegency", () => {
  it("should return districts for regency 11.01", () => {
    const result = repo.findDistrictsByRegency("11.01", 1, 50);
    expect(result.data.length).toBe(18);
    expect(result.total).toBe(18);
  });
});

describe("findDistrictByCode", () => {
  it("should return district by code", () => {
    const district = repo.findDistrictByCode("11.01.01");
    expect(district).toBeDefined();
    expect(district?.name).toBe("BAKONGAN");
  });
});

describe("findVillagesByDistrict", () => {
  it("should return villages for district 11.01.01", () => {
    const result = repo.findVillagesByDistrict("11.01.01", 1, 50);
    expect(result.data.length).toBe(7);
    expect(result.total).toBe(7);
  });
});

describe("findVillageByCode", () => {
  it("should return village", () => {
    const village = repo.findVillageByCode("11.01.01.2001");
    expect(village).toBeDefined();
    expect(village?.name).toBe("KEUDE BAKONGAN");
    expect(village?.type).toBe("kelurahan");
  });
});

describe("searchRegions", () => {
  it("should search by name", () => {
    const result = repo.searchRegions("Bakongan", undefined, 1, 50);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it("should search with type filter", () => {
    const result = repo.searchRegions("Aceh", "kabupaten", 1, 50);
    expect(result.data.length).toBeGreaterThan(0);
  });
});

describe("findVillagesByPostalCode", () => {
  it("should return empty for non-existent postal code", () => {
    const result = repo.findVillagesByPostalCode("00000", 1, 50);
    expect(result.data.length).toBe(0);
  });
});
