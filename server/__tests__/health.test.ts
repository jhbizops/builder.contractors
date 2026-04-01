import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  createHealthRouter,
  probeBilling,
  probeDatabase,
  probeExportStorage,
  probeSessionStore,
} from "../routes/health";

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

describe("runtime probes", () => {
  it("probes session store through the session table", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });

    const result = await probeSessionStore({ query });

    expect(result.status).toBe("ok");
    expect(query).toHaveBeenCalledWith("select 1 from user_sessions limit 1");
  });

  it("reports billing probe failures", async () => {
    const listPlans = vi.fn().mockRejectedValue(new Error("billing-down"));

    const result = await probeBilling({ listPlans });

    expect(result.status).toBe("error");
    expect(result.message).toBe("billing-down");
  });

  it("checks export storage accessibility", async () => {
    const result = await probeExportStorage();

    expect(result.status).toBe("ok");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
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
        runtime: { enabled: false },
      }),
    );
  });

  it("returns healthy runtime components when optional checks pass", async () => {
    const app = express().use(
      "/",
      createHealthRouter({
        startup: {
          snapshot: () => ({ status: "ready", dependencies: [], checkedAt: new Date().toISOString() }),
        } as any,
        checks: {
          database: vi.fn().mockResolvedValue({ status: "ok", latencyMs: 2 }),
          sessionStore: vi.fn().mockResolvedValue({ status: "ok", latencyMs: 1 }),
          billing: vi.fn().mockResolvedValue({ status: "ok", latencyMs: 4 }),
          exportStorage: vi.fn().mockResolvedValue({ status: "ok", latencyMs: 3 }),
        },
      }),
    );

    const response = await request(app).get("/ready").query({ runtimeChecks: "true" });

    expect(response.status).toBe(200);
    expect(response.body.runtime).toEqual(
      expect.objectContaining({
        enabled: true,
        status: "healthy",
      }),
    );
    expect(response.body.runtime.components).toEqual(
      expect.objectContaining({
        database: expect.objectContaining({ status: "ok", latencyMs: 2 }),
        sessionStore: expect.objectContaining({ status: "ok", latencyMs: 1 }),
        billing: expect.objectContaining({ status: "ok", latencyMs: 4 }),
        exportStorage: expect.objectContaining({ status: "ok", latencyMs: 3 }),
      }),
    );
  });

  it("returns degraded runtime status when any optional check fails", async () => {
    const app = express().use(
      "/",
      createHealthRouter({
        startup: {
          snapshot: () => ({ status: "ready", dependencies: [], checkedAt: new Date().toISOString() }),
        } as any,
        checks: {
          database: vi.fn().mockResolvedValue({ status: "ok", latencyMs: 2 }),
          sessionStore: vi.fn().mockResolvedValue({ status: "ok", latencyMs: 1 }),
          billing: vi.fn().mockResolvedValue({ status: "error", latencyMs: 6, message: "stripe-timeout" }),
          exportStorage: vi.fn().mockResolvedValue({ status: "ok", latencyMs: 3 }),
        },
      }),
    );

    const response = await request(app).get("/ready").query({ runtimeChecks: "1" });

    expect(response.status).toBe(503);
    expect(response.body.runtime).toEqual(
      expect.objectContaining({
        enabled: true,
        status: "degraded",
      }),
    );
    expect(response.body.runtime.components.billing).toEqual(
      expect.objectContaining({
        status: "error",
        latencyMs: 6,
        message: "stripe-timeout",
      }),
    );
  });
});
