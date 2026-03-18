import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_ORIGIN = "https://www.builder.contractors";
const expectedOrigin = new URL(process.env.PUBLIC_SITE_URL ?? DEFAULT_ORIGIN).origin;

const seoCriticalFiles = [
  "client/src/lib/structuredData.ts",
  "client/src/components/HeadManager.tsx",
  "client/src/lib/marketingPrerender.ts",
  "server/routes/seo.ts",
  "scripts/prerender-public.ts",
  "client/index.html",
  "client/public/llms.txt",
];

const canonicalOriginPattern = /https?:\/\/(?:www\.)?builder\.contractors/gi;

const failures = [];

for (const filePath of seoCriticalFiles) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const content = await readFile(absolutePath, "utf-8");

  const explicitOrigins = Array.from(content.matchAll(canonicalOriginPattern), (match) => match[0]);
  const uniqueOrigins = [...new Set(explicitOrigins.map((origin) => new URL(origin).origin))];

  for (const origin of uniqueOrigins) {
    if (origin !== expectedOrigin) {
      failures.push(`${filePath}: found canonical origin '${origin}' but expected '${expectedOrigin}'`);
    }
  }

  if (filePath === "client/index.html" && !content.includes("%PUBLIC_SITE_URL%")) {
    failures.push(`${filePath}: expected %PUBLIC_SITE_URL% token for canonical metadata`);
  }

  if (filePath === "client/public/llms.txt" && !content.includes("{{PUBLIC_SITE_URL}}")) {
    failures.push(`${filePath}: expected {{PUBLIC_SITE_URL}} template token`);
  }
}

if (failures.length > 0) {
  console.error("Mixed canonical origin check failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Canonical origin check passed for ${seoCriticalFiles.length} SEO-critical files using ${expectedOrigin}.`);
