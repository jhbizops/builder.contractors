import { promises as fs } from "node:fs";
import { resolvePublicSiteOrigin } from "../shared/publicSiteUrl";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { sitemapRoutes } from "../client/src/content/routes";
import {
  buildMarketingHeadMarkup,
  getMarketingRenderPages,
  injectMarketingHead,
  type MarketingRenderPage,
} from "../client/src/lib/marketingPrerender";

const rootDir = process.cwd();
const distPublicDir = path.join(rootDir, "dist", "public");
const baseUrl = resolvePublicSiteOrigin(process.env.PUBLIC_SITE_URL);

export const normalizeRoutePath = (routePath: string): string => {
  if (routePath === "/") {
    return "/";
  }
  return routePath.endsWith("/") ? routePath.slice(0, -1) : routePath;
};

const pageOutputDir = (canonicalPath: string): string => {
  if (canonicalPath === "/") {
    return distPublicDir;
  }
  return path.join(distPublicDir, canonicalPath.replace(/^\//, ""));
};

export const staticHtmlFilePathFromRoute = (routePath: string, staticRoot = distPublicDir): string => {
  const normalizedPath = normalizeRoutePath(routePath);
  if (normalizedPath === "/") {
    return path.join(staticRoot, "index.html");
  }
  return path.join(staticRoot, normalizedPath.replace(/^\//, ""), "index.html");
};

export const assertSitemapRoutesHaveStaticHtml = (
  routes: Array<{ path: string }>,
  pages: MarketingRenderPage[],
): void => {
  const generatedPaths = new Set(pages.map((page) => normalizeRoutePath(page.canonicalPath)));
  const missingRoutes = routes
    .map((route) => normalizeRoutePath(route.path))
    .filter((routePath) => !generatedPaths.has(routePath));

  if (missingRoutes.length > 0) {
    throw new Error(
      `Missing prerendered pages for sitemap routes: ${missingRoutes
        .sort((a, b) => a.localeCompare(b))
        .join(", ")}`,
    );
  }
};

const writePage = async (template: string, page: MarketingRenderPage) => {
  const headMarkup = buildMarketingHeadMarkup(page, baseUrl);
  const outputHtml = injectMarketingHead(template, headMarkup);
  const targetDir = pageOutputDir(page.canonicalPath);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(path.join(targetDir, "index.html"), outputHtml, "utf-8");
};

const validateRenderedArtifact = async (routePath: string, expected: string[]) => {
  const filePath = staticHtmlFilePathFromRoute(routePath);
  const html = await fs.readFile(filePath, "utf-8");

  expected.forEach((needle) => {
    if (!html.includes(needle)) {
      throw new Error(`Validation failed for ${routePath}: missing '${needle}' in ${filePath}`);
    }
  });
};

const validateArtifacts = async () => {
  await validateRenderedArtifact("/", [
    `<link rel="canonical" href="${baseUrl}/"`,
    `"@type":"Organization"`,
    `"@type":"Service"`,
  ]);

  await validateRenderedArtifact("/au/about", [
    `<link rel="canonical" href="${baseUrl}/au/about"`,
    `<meta property="og:url" content="${baseUrl}/au/about"`,
    `"@type":"FAQPage"`,
  ]);
};

const main = async () => {
  const templatePath = path.join(distPublicDir, "index.html");
  const template = await fs.readFile(templatePath, "utf-8");
  const pages = getMarketingRenderPages();

  assertSitemapRoutesHaveStaticHtml(sitemapRoutes, pages);
  await Promise.all(pages.map((page) => writePage(template, page)));
  await validateArtifacts();
};

const scriptEntrypoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === scriptEntrypoint) {
  await main();
}
