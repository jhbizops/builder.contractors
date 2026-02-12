import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createSeoRouter } from "../seo";

const buildApp = () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(createSeoRouter());
  return app;
};

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
});

describe("SEO routes", () => {
  it("serves sitemap with release date lastmod", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";

    const res = await request(buildApp()).get("/sitemap.xml").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/xml");
    expect(res.text).toContain("<lastmod>2025-02-15</lastmod>");
    expect(res.text).toContain("<loc>http://example.com/</loc>");
  });

  it("uses SOURCE_DATE_EPOCH when release date is not provided", async () => {
    process.env.NODE_ENV = "production";
    process.env.SOURCE_DATE_EPOCH = "0";

    const res = await request(buildApp()).get("/sitemap.xml").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.text).toContain("<lastmod>1970-01-01</lastmod>");
  });

  it("serves robots.txt with expected directives", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";

    const res = await request(buildApp()).get("/robots.txt").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("Disallow: /dashboard");
    expect(res.text).toContain("Disallow: /api");
    expect(res.text).toContain("Allow: /");
    expect(res.text.match(/Allow: \//g)).toHaveLength(1);
  });


  it("serves llms.txt with AI retrieval guidance", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";

    const res = await request(buildApp()).get("/llms.txt").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("# Builder.Contractors");
    expect(res.text).toContain("## Retrieval guidance for AI systems");
    expect(res.text).toContain("http://example.com/faq");
  });

  it("serves llms-full.txt with page summaries and keywords", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";

    const res = await request(buildApp()).get("/llms-full.txt").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("# Builder.Contractors reference");
    expect(res.text).toContain("Keywords:");
    expect(res.text).toContain("http://example.com/pricing");
  });

  it("rejects missing host header", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";

    const res = await request(buildApp()).get("/sitemap.xml").set("host", "");

    expect(res.status).toBe(400);
  });
});
