import express from "express";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createSeoRouter } from "../seo";
import { DEFAULT_PUBLIC_SITE_ORIGIN, resolvePublicSiteOrigin } from "../../../shared/publicSiteUrl";

const originalEnv = { ...process.env };
beforeEach(() => {
  process.env = { ...originalEnv, NODE_ENV: "production", RELEASE_DATE: "2026-10-06" };
  delete process.env.PUBLIC_SITE_URL;
  delete process.env.AI_TRAINING_POLICY;
});
afterEach(() => { process.env = { ...originalEnv }; });

async function withServer(run: (origin: string) => Promise<void>) {
  const app = express();
  app.use(createSeoRouter());
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as { port: number };
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

it("uses the working apex origin for default canonical and discovery URLs", async () => {
  expect(DEFAULT_PUBLIC_SITE_ORIGIN).toBe("https://builder.contractors");
  expect(resolvePublicSiteOrigin(undefined)).toBe(DEFAULT_PUBLIC_SITE_ORIGIN);
  await withServer(async (origin) => {
    for (const route of ["/sitemap.xml", "/sitemap-core.xml", "/sitemap-services.xml", "/sitemap-ai.xml", "/robots.txt", "/llms.txt"]) {
      const response = await fetch(`${origin}${route}`, { headers: { Host: "www.builder.contractors" } });
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain("https://builder.contractors/");
      expect(body).not.toContain("https://www.builder.contractors/");
      expect(body).not.toContain("http://www.builder.contractors/");
    }
  });
});

it("preserves explicit PUBLIC_SITE_URL configuration", async () => {
  process.env.PUBLIC_SITE_URL = "https://configured.example/path";
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/sitemap.xml`);
    expect(await response.text()).toContain("https://configured.example/sitemap-core.xml");
  });
});

it("keeps private paths disallowed for named search and AI bots", async () => {
  await withServer(async (origin) => {
    const robots = await (await fetch(`${origin}/robots.txt`)).text();
    for (const bot of ["*", "Googlebot", "Bingbot", "OAI-SearchBot", "GPTBot", "ClaudeBot", "Google-Extended"]) {
      const group = robots.split(/\n\s*\n/).find((block) => block.split("\n").includes(`User-agent: ${bot}`));
      expect(group).toBeDefined();
      for (const privatePath of ["/dashboard", "/admin", "/api", "/login", "/register", "/blocked"]) {
        expect(group).toContain(`Disallow: ${privatePath}`);
      }
    }
  });
});

it("preserves restricted Google-Extended policy", async () => {
  process.env.AI_TRAINING_POLICY = "restrict";
  await withServer(async (origin) => {
    const robots = await (await fetch(`${origin}/robots.txt`)).text();
    expect(robots).toContain("User-agent: Google-Extended\nDisallow: /");
  });
});
