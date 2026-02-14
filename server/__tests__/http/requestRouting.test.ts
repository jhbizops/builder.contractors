import { describe, expect, it } from "vitest";
import { buildApiLogLine, shouldSkipBodyParsers } from "../../http/requestRouting";

describe("request routing guards", () => {
  it("skips body parsers for exact webhook path and query string variants", () => {
    expect(shouldSkipBodyParsers("/api/billing/webhook")).toBe(true);
    expect(shouldSkipBodyParsers("/api/billing/webhook?attempt=1")).toBe(true);
    expect(shouldSkipBodyParsers("/api/billing/webhook/extra")).toBe(false);
  });

  it("builds compact API log lines without payload leakage", () => {
    const logLine = buildApiLogLine({
      method: "POST",
      path: "/api/auth/login",
      statusCode: 200,
      durationMs: 18,
    });

    expect(logLine).toBe("POST /api/auth/login 200 in 18ms");
    expect(logLine.includes("password")).toBe(false);
  });

  it("truncates very long log lines", () => {
    const logLine = buildApiLogLine({
      method: "GET",
      path: `/api/${"a".repeat(120)}`,
      statusCode: 200,
      durationMs: 4,
    });

    expect(logLine.endsWith("…")).toBe(true);
    expect(logLine.length).toBe(80);
  });
});
