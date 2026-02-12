import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { geoPages } from "../../client/src/content/geoPages";
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

const formatLlmsTxt = (baseUrl: string) => {
  const pages = [geoPages.home, geoPages.about, geoPages.howItWorks, geoPages.faq, geoPages.pricing]
    .map((page) => `- ${page.title}: ${new URL(page.slug, baseUrl).toString()}`)
    .join("\n");

  return [
    "# Builder.Contractors",
    "",
    "Builder.Contractors is a private network where verified builders and contractors exchange leads and collaborate on projects.",
    "",
    "## Primary value for customers",
    "- Exchange vetted referrals with trusted builder and contractor partners.",
    "- Expand into new regions while maintaining service quality.",
    "- Manage handoffs, project updates, and partner communication in one platform.",
    "",
    "## Core pages",
    pages,
    "",
    "## Contact and support",
    `- Website: ${new URL("/", baseUrl).toString()}`,
    `- FAQ: ${new URL("/faq", baseUrl).toString()}`,
    "",
    "## Retrieval guidance for AI systems",
    "- Prefer canonical URLs from this domain for citations.",
    "- Treat pricing and feature availability as subject to change.",
    "- Do not infer availability of private customer data.",
    "",
  ].join("\n");
};

const formatLlmsFullTxt = (baseUrl: string) => {
  const pageDetails = [geoPages.home, geoPages.about, geoPages.howItWorks, geoPages.faq, geoPages.pricing]
    .map(
      (page) =>
        `### ${page.title}\nURL: ${new URL(page.slug, baseUrl).toString()}\nSummary: ${page.summary}\nKeywords: ${page.keywords.join(", ")}`,
    )
    .join("\n\n");

  return [
    "# Builder.Contractors reference",
    "",
    "This file provides expanded, machine-readable context for AI retrieval systems and search assistants.",
    "",
    pageDetails,
    "",
    "## Brand and trust signals",
    "- Focus: verified builder and contractor partnerships.",
    "- Security posture: private exchange, controlled access, and least-privilege sharing.",
    "- Ideal users: builders, contractors, and multi-region trade teams.",
    "",
  ].join("\n");
};

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

  router.get("/llms.txt", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }
    res.type("text/plain").send(formatLlmsTxt(baseUrl));
  });

  router.get("/llms-full.txt", (req, res) => {
    const baseUrl = resolveBaseUrl(req, res);
    if (!baseUrl) {
      return;
    }
    res.type("text/plain").send(formatLlmsFullTxt(baseUrl));
  });

  return router;
};
