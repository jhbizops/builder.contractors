import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { sitemapRoutes } from "../../client/src/content/routes";

const protocolSchema = z.enum(["http", "https"]);
const hostSchema = z.string().min(1).max(255);

const normalizeLastmod = (value: string): string => {
  if (/^\d+$/.test(value)) {
    const epochSeconds = Number(value);
    const parsed = new Date(epochSeconds * 1000);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid sitemap lastmod epoch timestamp");
    }
    return parsed.toISOString().split("T")[0];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid sitemap lastmod date");
  }
  return parsed.toISOString().split("T")[0];
};

const resolveLastmod = (): string => {
  const rawValue =
    process.env.RELEASE_DATE ?? process.env.BUILD_DATE ?? process.env.SOURCE_DATE_EPOCH;

  if (!rawValue) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RELEASE_DATE or BUILD_DATE must be set for sitemap lastmod");
    }
    return new Date().toISOString().split("T")[0];
  }

  return normalizeLastmod(rawValue);
};

const formatSitemapXml = (baseUrl: string, lastmod: string) => {
  const urls = sitemapRoutes
    .map((route) => {
      const location = new URL(route.path, baseUrl).toString();
      const alternates = route.alternates
        ?.map((alternate) => {
          const alternateUrl = new URL(alternate.path, baseUrl).toString();
          return `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${alternateUrl}" />`;
        })
        .join("\n");
      return [
        "  <url>",
        `    <loc>${location}</loc>`,
        ...(alternates ? [alternates] : []),
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${route.changefreq}</changefreq>`,
        `    <priority>${route.priority.toFixed(1)}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls,
    "</urlset>",
  ].join("\n");
};

const formatRobotsTxt = (baseUrl: string) =>
  [
    "User-agent: *",
    "Disallow: /dashboard",
    "Disallow: /api",
    "Allow: /",
    `Sitemap: ${new URL("/sitemap.xml", baseUrl).toString()}`,
    "",
  ].join("\n");

const resolveBaseUrl = (req: Request, res: Response): string | null => {
  const protocolResult = protocolSchema.safeParse(req.protocol);
  const hostResult = hostSchema.safeParse(req.get("host"));

  if (!protocolResult.success || !hostResult.success) {
    res.status(400).send("Invalid host");
    return null;
  }

  return `${protocolResult.data}://${hostResult.data}`;
};

export const createSeoRouter = (): Router => {
  const router = Router();
  const lastmod = resolveLastmod();

  router.get("/sitemap.xml", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }
    res.type("application/xml").send(formatSitemapXml(baseUrl, lastmod));
  });

  router.get("/robots.txt", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }
    res.type("text/plain").send(formatRobotsTxt(baseUrl));
  });

  return router;
};
