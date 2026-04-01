import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  createSecurityHeadersMiddleware,
} from "../../middleware/securityHeaders";

describe("buildContentSecurityPolicy", () => {
  it("includes only required production directives", () => {
    const csp = buildContentSecurityPolicy(true);

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("https://replit.com");
    expect(csp).not.toContain("ws:");
  });

  it("allows local dev runtime integrations", () => {
    const csp = buildContentSecurityPolicy(false);

    expect(csp).toContain("script-src 'self' https://replit.com");
    expect(csp).toContain("connect-src 'self' ws: wss:");
  });
});

describe("createSecurityHeadersMiddleware", () => {
  it("sets security headers and noindex for private routes", async () => {
    const app = express();
    app.use(createSecurityHeadersMiddleware(true));
    app.get("/api/private", (_req, res) => res.status(200).json({ ok: true }));

    const response = await request(app).get("/api/private").set("x-forwarded-proto", "https");

    expect(response.status).toBe(200);
    expect(response.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(response.headers["x-robots-tag"]).toBe("noindex, nofollow, noarchive, nosnippet");
    expect(response.headers["strict-transport-security"]).toBe(
      "max-age=31536000; includeSubDomains",
    );
  });

  it("does not set hsts when request is not https", async () => {
    const app = express();
    app.use(createSecurityHeadersMiddleware(true));
    app.get("/", (_req, res) => res.status(200).send("ok"));

    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.headers["strict-transport-security"]).toBeUndefined();
    expect(response.headers["x-robots-tag"]).toBe(
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
  });
});
