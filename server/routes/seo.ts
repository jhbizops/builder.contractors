import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { geoPages } from "../../client/src/content/geoPages";
import { sitemapRoutes } from "../../client/src/content/routes";
import { DEFAULT_PUBLIC_SITE_ORIGIN, toPublicSiteOrigin } from "../../shared/publicSiteUrl";
import { renderLlmsFullTxt, renderLlmsTxt, type LlmsPage } from "../../shared/seo/llmsContent";

const protocolSchema = z.enum(["http", "https"]);
const hostSchema = z.string().min(1).max(255);

const SEARCH_BOTS = [
  "Googlebot",
  "Bingbot",
  "Applebot",
  "GoogleOther",
  "GoogleOther-Image",
  "GoogleOther-Video",
  "PerplexityBot",
  "OAI-SearchBot",
  "Bytespider",
  "ChatGPT-User",
  "ChatGPT-Search",
  "Claude-SearchBot",
  "ClaudeBot",
  "BraveBot",
  "DuckAssistBot",
  "YouBot",
  "facebookexternalhit",
  "LinkedInBot",
  "AhrefsBot",
  "SemrushBot",
  "CCBot",
  "GPTBot",
] as const;

const BLOCKED_SCRAPERS = ["DotBot", "MJ12bot", "BLEXBot", "SemrushBot-SA", "ZoominfoBot"] as const;

const PUBLIC_SERVICE_PATHS = ["/", "/about", "/how-it-works", "/faq", "/pricing"];

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

const resolveGeoTrainingPolicy = (): "allow" | "restrict" =>
  process.env.AI_TRAINING_POLICY === "restrict" ? "restrict" : "allow";

const resolveGoogleExtendedDirective = (): string =>
  resolveGeoTrainingPolicy() === "restrict" ? "Disallow: /" : "Allow: /";

const formatUrlset = (
  urls: Array<{ path: string; changefreq: string; priority: number; alternates?: Array<{ hreflang: string; path: string }> }>,
  baseUrl: string,
  lastmod: string,
) => {
  const entries = urls
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
    entries,
    "</urlset>",
  ].join("\n");
};

const formatSitemapIndexXml = (baseUrl: string, lastmod: string) => {
  const maps = ["/sitemap-core.xml", "/sitemap-services.xml", "/sitemap-ai.xml"]
    .map((path) => {
      const loc = new URL(path, baseUrl).toString();
      return ["  <sitemap>", `    <loc>${loc}</loc>`, `    <lastmod>${lastmod}</lastmod>`, "  </sitemap>"].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    maps,
    "</sitemapindex>",
  ].join("\n");
};

const formatRobotsTxt = (baseUrl: string) => {
  const lines = [
    "# Builder.Contractors crawler policy",
    "User-agent: *",
    "Disallow: /dashboard",
    "Disallow: /admin",
    "Disallow: /api",
    "Disallow: /login",
    "Disallow: /register",
    "Disallow: /blocked",
    "Allow: /",
    "",
    "# Known spam and bulk scraping bots",
    ...BLOCKED_SCRAPERS.flatMap((bot) => [`User-agent: ${bot}`, "Disallow: /", ""]),
    "# Search, social, and AI indexing bots",
    ...SEARCH_BOTS.flatMap((bot) => [`User-agent: ${bot}`, "Allow: /", "Crawl-delay: 2", ""]),
    "User-agent: Google-Extended",
    resolveGoogleExtendedDirective(),
    "",
    `AI-Policy: ${resolveGeoTrainingPolicy()}`,
    `LLM-Content: ${new URL("/llms.txt", baseUrl).toString()}`,
    `LLM-Content-Full: ${new URL("/llms-full.txt", baseUrl).toString()}`,
    "",
    `Sitemap: ${new URL("/sitemap.xml", baseUrl).toString()}`,
    `Sitemap: ${new URL("/sitemap-ai.xml", baseUrl).toString()}`,
    `Host: ${new URL(baseUrl).host}`,
    "",
  ];

  return lines.join("\n");
};

const llmsPages: LlmsPage[] = [geoPages.home, geoPages.about, geoPages.howItWorks, geoPages.faq, geoPages.pricing].map((page) => ({
  slug: page.slug,
  title: page.title,
  summary: page.summary,
  keywords: page.keywords,
}));

const resolveBaseUrl = (req: Request, res: Response): string | null => {
  const configuredUrl = process.env.PUBLIC_SITE_URL;
  if (configuredUrl) {
    const canonicalOrigin = toPublicSiteOrigin(configuredUrl);
    if (!canonicalOrigin) {
      res.status(500).send("Invalid PUBLIC_SITE_URL");
      return null;
    }
    return canonicalOrigin;
  }

  const protocolResult = protocolSchema.safeParse(req.protocol);
  const hostResult = hostSchema.safeParse(req.get("host"));

  if (!protocolResult.success || !hostResult.success) {
    res.status(400).send("Invalid host");
    return null;
  }

  return toPublicSiteOrigin(`${protocolResult.data}://${hostResult.data}`) ?? DEFAULT_PUBLIC_SITE_ORIGIN;
};

export const createSeoRouter = (): Router => {
  const router = Router();
  const lastmod = resolveLastmod();

  router.get("/sitemap.xml", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }
    res.type("application/xml").send(formatSitemapIndexXml(baseUrl, lastmod));
  });

  router.get("/sitemap-core.xml", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }

    res.type("application/xml").send(formatUrlset(sitemapRoutes, baseUrl, lastmod));
  });

  router.get("/sitemap-services.xml", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }

    const serviceUrls = PUBLIC_SERVICE_PATHS.map((path) => ({ path, changefreq: "weekly", priority: 0.9 }));
    res.type("application/xml").send(formatUrlset(serviceUrls, baseUrl, lastmod));
  });

  router.get("/sitemap-ai.xml", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }

    const aiUrls = PUBLIC_SERVICE_PATHS.map((path) => ({ path, changefreq: "daily", priority: 1 }));
    res.type("application/xml").send(formatUrlset(aiUrls, baseUrl, lastmod));
  });

  router.get("/robots.txt", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }
    res.type("text/plain").send(formatRobotsTxt(baseUrl));
  });

  router.get("/llms.txt", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }
    res.setHeader("X-Robots-Tag", "index, follow, max-snippet:-1, max-image-preview:large");
    res.type("text/plain").send(
      renderLlmsTxt({
        allowTraining: resolveGeoTrainingPolicy() === "allow",
        baseUrl,
        pages: llmsPages,
      }),
    );
  });

  router.get("/llms-full.txt", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }
    res.setHeader("X-Robots-Tag", "index, follow, max-snippet:-1, max-image-preview:large");
    res.type("text/plain").send(renderLlmsFullTxt({ baseUrl, pages: llmsPages }));
  });

  router.get("/ai.txt", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }
    res.setHeader("X-Robots-Tag", "index, follow, max-snippet:-1, max-image-preview:large");
    res.type("text/plain").send(
      renderLlmsTxt({
        allowTraining: resolveGeoTrainingPolicy() === "allow",
        baseUrl,
        pages: llmsPages,
      }),
    );
  });

  return router;
};
