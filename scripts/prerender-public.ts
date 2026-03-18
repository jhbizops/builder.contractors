import { promises as fs } from "node:fs";
import path from "node:path";
import {
  buildMarketingHeadMarkup,
  getMarketingRenderPages,
  injectMarketingHead,
  type MarketingRenderPage,
} from "../client/src/lib/marketingPrerender";

const rootDir = process.cwd();
const distPublicDir = path.join(rootDir, "dist", "public");
const baseUrl = process.env.PUBLIC_SITE_URL ?? "https://www.builder.contractors";

const pageOutputDir = (canonicalPath: string): string => {
  if (canonicalPath === "/") {
    return distPublicDir;
  }
  return path.join(distPublicDir, canonicalPath.replace(/^\//, ""));
};

const writePage = async (template: string, page: MarketingRenderPage) => {
  const headMarkup = buildMarketingHeadMarkup(page, baseUrl);
  const outputHtml = injectMarketingHead(template, headMarkup);
  const targetDir = pageOutputDir(page.canonicalPath);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(path.join(targetDir, "index.html"), outputHtml, "utf-8");
};

const validateRenderedArtifact = async (routePath: string, expected: string[]) => {
  const filePath = path.join(pageOutputDir(routePath), "index.html");
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

  await Promise.all(pages.map((page) => writePage(template, page)));
  await validateArtifacts();
};

await main();
