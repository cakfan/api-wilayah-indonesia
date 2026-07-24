import { describe, it, expect } from "bun:test";
import { app } from "@/index";

describe("GET /", () => {
  it("should return API message", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.message).toBe("API Wilayah Indonesia");
  });
});

describe("GET /health", () => {
  it("should return healthy status", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("healthy");
    expect(body.data.database).toBe("connected");
  });
});

describe("GET /api/v1/provinces", () => {
  it("should return list of provinces", async () => {
    const res = await app.request("/api/v1/provinces");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(5);
    expect(body.meta).toBeDefined();
    expect(body.meta.total).toBe(5);
  });
});

describe("GET /api/v1/provinces/:code", () => {
  it("should return province by code", async () => {
    const res = await app.request("/api/v1/provinces/11");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.code).toBe("11");
    expect(body.data.name).toBe("ACEH");
  });

  it("should return 404 for non-existent code", async () => {
    const res = await app.request("/api/v1/provinces/99");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("GET /api/v1/provinces/:code/regencies", () => {
  it("should return regencies for province", async () => {
    const res = await app.request("/api/v1/provinces/11/regencies");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(3);
    expect(body.meta.total).toBe(3);
  });

  it("should support pagination", async () => {
    const res = await app.request("/api/v1/provinces/11/regencies?page=1&limit=2");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(2);
    expect(body.meta.total).toBe(3);
    expect(body.meta.totalPages).toBe(2);
  });

  it("should return 404 for non-existent province", async () => {
    const res = await app.request("/api/v1/provinces/99/regencies");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/regencies/:code", () => {
  it("should return regency by code", async () => {
    const res = await app.request("/api/v1/regencies/11.01");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.code).toBe("11.01");
    expect(body.data.name).toBe("KAB. ACEH SELATAN");
  });

  it("should return 404 for non-existent code", async () => {
    const res = await app.request("/api/v1/regencies/99.99");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/regencies/:code/districts", () => {
  it("should return districts for regency", async () => {
    const res = await app.request("/api/v1/regencies/11.01/districts");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(2);
  });
});

describe("GET /api/v1/districts/:code", () => {
  it("should return district by code", async () => {
    const res = await app.request("/api/v1/districts/11.01.01");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.code).toBe("11.01.01");
    expect(body.data.name).toBe("Kec. Bakongan");
  });

  it("should return 404 for non-existent code", async () => {
    const res = await app.request("/api/v1/districts/99.99.99");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/districts/:code/villages", () => {
  it("should return villages for district", async () => {
    const res = await app.request("/api/v1/districts/11.01.01/villages");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(2);
  });
});

describe("GET /api/v1/villages/:code", () => {
  it("should return village with postal code and coordinates", async () => {
    const res = await app.request("/api/v1/villages/11.01.01.2001");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.code).toBe("11.01.01.2001");
    expect(body.data.name).toBe("Desa Bakongan");
    expect(body.data.postal_code).toBe("23773");
    expect(body.data.latitude).toBe(2.9561);
    expect(body.data.longitude).toBe(97.2847);
  });

  it("should return 404 for non-existent code", async () => {
    const res = await app.request("/api/v1/villages/99.99.99.9999");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/search", () => {
  it("should search by name", async () => {
    const res = await app.request("/api/v1/search?q=Bakongan");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("should filter by type", async () => {
    const res = await app.request("/api/v1/search?q=Aceh&type=kabupaten");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("should return 400 for missing q parameter", async () => {
    const res = await app.request("/api/v1/search");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/postal-codes/:code", () => {
  it("should return villages by postal code", async () => {
    const res = await app.request("/api/v1/postal-codes/10310");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].name).toBe("Kel. Menteng");
  });

  it("should return 400 for invalid postal code format", async () => {
    const res = await app.request("/api/v1/postal-codes/abc");
    expect(res.status).toBe(400);
  });

  it("should return empty array for non-existent postal code", async () => {
    const res = await app.request("/api/v1/postal-codes/00000");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(0);
  });
});

describe("Response headers", () => {
  it("should include rate limit headers", async () => {
    const res = await app.request("/api/v1/provinces");
    expect(res.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(res.headers.get("X-RateLimit-Remaining")).toBeDefined();
    expect(res.headers.get("X-RateLimit-Reset")).toBeDefined();
  });

  it("should include cache control for API routes", async () => {
    const res = await app.request("/api/v1/provinces");
    expect(res.headers.get("Cache-Control")).toContain("max-age=86400");
  });

  it("should include no-store for health endpoint", async () => {
    const res = await app.request("/health");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
