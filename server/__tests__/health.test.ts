import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createHealthRouter, probeDatabase } from "../routes/health";

describe("probeDatabase", () => {
  it("returns ok when query resolves quickly", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });

    const result = await probeDatabase({ query });

    expect(result.status).toBe("ok");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(query).toHaveBeenCalledWith("select 1");
  });

  it("returns error when query rejects", async () => {
    const query = vi.fn().mockRejectedValue(new Error("boom"));

    const result = await probeDatabase({ query });

    expect(result.status).toBe("error");
    expect(result.message).toBe("boom");
  });

  it("times out when query is slow", async () => {
    const query = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ rows: [] }), 1000)),
    );

    const result = await probeDatabase({ query }, 50);

    expect(result.status).toBe("error");
    expect(result.message).toBe("health-db-timeout");
  });
});

describe("createHealthRouter", () => {
  it("responds with a fast liveness payload", async () => {
    const app = express().use(
      "/",
      createHealthRouter({
        startup: {
          snapshot: () => ({ status: "ready", dependencies: [], checkedAt: new Date().toISOString() }),
        } as any,
      }),
    );

    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: "live",
      }),
    );
  });

  it("responds with 503 when readiness is not satisfied", async () => {
    const app = express().use(
      "/",
      createHealthRouter({
        startup: {
          snapshot: () => ({
            status: "not_ready",
            dependencies: [{ name: "database", critical: true, status: "error" }],
            checkedAt: new Date().toISOString(),
          }),
        } as any,
      }),
    );

    const response = await request(app).get("/ready");

    expect(response.status).toBe(503);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: "not_ready",
      }),
    );
  });
});
