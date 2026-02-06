import { promises as fs } from "node:fs";
import path from "node:path";
import { geoPages } from "../client/src/content/geoPages";

type SeoPage = {
  slug: string;
  title: string;
  summary: string;
  keywords: string[];
};

const rootDir = process.cwd();
const distPublicDir = path.join(rootDir, "dist", "public");
const baseUrl = process.env.PUBLIC_SITE_URL ?? "https://www.builder.contractors";

const replaceTag = (html: string, regex: RegExp, replacement: string) =>
  regex.test(html) ? html.replace(regex, replacement) : html;

const applySeo = (html: string, page: SeoPage) => {
  const canonicalUrl = new URL(page.slug, baseUrl).toString();
  const keywordContent = page.keywords.join(", ");

  let updated = html;
  updated = replaceTag(updated, /<title>[\s\S]*?<\/title>/i, `<title>${page.title}</title>`);
  updated = replaceTag(
    updated,
    /<meta name="title" content="[^"]*"\s*\/?>/i,
    `<meta name="title" content="${page.title}" />`,
  );
  updated = replaceTag(
    updated,
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${page.summary}" />`,
  );
  updated = replaceTag(
    updated,
    /<meta name="keywords" content="[^"]*"\s*\/?>/i,
    `<meta name="keywords" content="${keywordContent}" />`,
  );
  updated = replaceTag(
    updated,
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${page.title}" />`,
  );
  updated = replaceTag(
    updated,
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${page.summary}" />`,
  );
  updated = replaceTag(
    updated,
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`,
  );
  updated = replaceTag(
    updated,
    /<meta property="twitter:title" content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:title" content="${page.title}" />`,
  );
  updated = replaceTag(
    updated,
    /<meta property="twitter:description" content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:description" content="${page.summary}" />`,
  );
  updated = replaceTag(
    updated,
    /<meta property="twitter:url" content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:url" content="${canonicalUrl}" />`,
  );
  updated = replaceTag(
    updated,
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`,
  );

  return updated;
};

const writePage = async (template: string, page: SeoPage) => {
  const outputHtml = applySeo(template, page);
  const targetDir =
    page.slug === "/" ? distPublicDir : path.join(distPublicDir, page.slug.replace(/^\//, ""));
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(path.join(targetDir, "index.html"), outputHtml);
};

const main = async () => {
  const templatePath = path.join(distPublicDir, "index.html");
  const template = await fs.readFile(templatePath, "utf-8");
  const pages: SeoPage[] = Object.values(geoPages).map((page) => ({
    slug: page.slug,
    title: page.title,
    summary: page.summary,
    keywords: page.keywords,
  }));

  await Promise.all(pages.map((page) => writePage(template, page)));
};

await main();
