import { promises as fs } from "node:fs";
import path from "node:path";
import { geoPages } from "../client/src/content/geoPages";
import { renderLlmsFullTxt, renderLlmsTxt } from "../shared/seo/llmsContent";

const publicDir = path.join(process.cwd(), "client", "public");
const baseUrlPlaceholder = "{{PUBLIC_SITE_URL}}";

const llmsPages = Object.values(geoPages).map((page) => ({
  slug: page.slug,
  title: page.title,
  summary: page.summary,
  keywords: page.keywords,
}));

const llmsTxt = renderLlmsTxt({
  allowTraining: true,
  baseUrl: baseUrlPlaceholder,
  pages: llmsPages,
});

const llmsFullTxt = renderLlmsFullTxt({
  baseUrl: baseUrlPlaceholder,
  pages: llmsPages,
});

await Promise.all([
  fs.writeFile(path.join(publicDir, "llms.txt"), llmsTxt, "utf-8"),
  fs.writeFile(path.join(publicDir, "llms-full.txt"), llmsFullTxt, "utf-8"),
  fs.writeFile(path.join(publicDir, "ai.txt"), llmsTxt, "utf-8"),
]);
