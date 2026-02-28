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
  it("serves sitemap index with service and ai sitemap entries", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";

    const res = await request(buildApp()).get("/sitemap.xml").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/xml");
    expect(res.text).toContain("<loc>http://example.com/sitemap-core.xml</loc>");
    expect(res.text).toContain("<loc>http://example.com/sitemap-services.xml</loc>");
    expect(res.text).toContain("<loc>http://example.com/sitemap-ai.xml</loc>");
  });

  it("uses SOURCE_DATE_EPOCH when release date is not provided", async () => {
    process.env.NODE_ENV = "production";
    process.env.SOURCE_DATE_EPOCH = "0";

    const res = await request(buildApp()).get("/sitemap-core.xml").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.text).toContain("<lastmod>1970-01-01</lastmod>");
  });

  it("serves robots.txt with expected bot directives", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";

    const res = await request(buildApp()).get("/robots.txt").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("User-agent: Googlebot");
    expect(res.text).toContain("User-agent: OAI-SearchBot");
    expect(res.text).toContain("User-agent: ChatGPT-Search");
    expect(res.text).toContain("User-agent: DuckAssistBot");
    expect(res.text).toContain("User-agent: Claude-SearchBot");
    expect(res.text).toContain("User-agent: Google-Extended");
    expect(res.text).toContain("User-agent: DotBot");
    expect(res.text).toContain("Disallow: /admin");
    expect(res.text).toContain("Disallow: /login");
    expect(res.text).toContain("Disallow: /register");
    expect(res.text).toContain("AI-Policy: allow");
    expect(res.text).toContain("LLM-Content: http://example.com/llms.txt");
    expect(res.text).toContain("Sitemap: http://example.com/sitemap-ai.xml");
  });

  it("configures Google-Extended restriction when AI policy is restricted", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";
    process.env.AI_TRAINING_POLICY = "restrict";

    const res = await request(buildApp()).get("/robots.txt").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.text).toContain("User-agent: Google-Extended\nDisallow: /");
  });

  it("serves llms.txt with AI retrieval guidance", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";

    const res = await request(buildApp()).get("/llms.txt").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.headers["x-robots-tag"]).toContain("max-image-preview:large");
    expect(res.text).toContain("# Builder.Contractors");
    expect(res.text).toContain("## AI indexing directives");
    expect(res.text).toContain("Allow citation: yes");
  });

  it("serves llms-full.txt with page summaries and keywords", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";

    const res = await request(buildApp()).get("/llms-full.txt").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.headers["x-robots-tag"]).toContain("max-snippet:-1");
    expect(res.text).toContain("# Builder.Contractors reference");
    expect(res.text).toContain("Keywords:");
    expect(res.text).toContain("http://example.com/pricing");
  });

  it("serves ai.txt as an alias to llms guidance", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";

    const res = await request(buildApp()).get("/ai.txt").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("## AI indexing directives");
  });

  it("rejects missing host header", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";

    const res = await request(buildApp()).get("/sitemap.xml").set("host", "");

    expect(res.status).toBe(400);
  });

  it("uses PUBLIC_SITE_URL when set", async () => {
    process.env.NODE_ENV = "production";
    process.env.RELEASE_DATE = "2025-02-15";
    process.env.PUBLIC_SITE_URL = "https://www.builder.contractors";

    const res = await request(buildApp()).get("/sitemap.xml").set("host", "example.com");

    expect(res.status).toBe(200);
    expect(res.text).toContain("<loc>https://www.builder.contractors/sitemap-core.xml</loc>");
  });
});
