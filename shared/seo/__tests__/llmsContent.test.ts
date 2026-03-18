import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { geoPages } from "../../../client/src/content/geoPages";
import { LLM_BRAND, LLM_KEY_PUBLIC_PATHS, renderLlmsFullTxt, renderLlmsTxt } from "../llmsContent";

const llmsPages = Object.values(geoPages).map((page) => ({
  slug: page.slug,
  title: page.title,
  summary: page.summary,
  keywords: page.keywords,
}));

const placeholderBaseUrl = "{{PUBLIC_SITE_URL}}";

const readStaticAsset = (filename: "llms.txt" | "llms-full.txt" | "ai.txt") =>
  readFileSync(path.join(process.cwd(), "client", "public", filename), "utf-8");

describe("LLMS content model synchronization", () => {
  it("keeps generated static llms assets in sync with the shared content model", () => {
    const expectedLlms = renderLlmsTxt({
      allowTraining: true,
      baseUrl: placeholderBaseUrl,
      pages: llmsPages,
    });
    const expectedLlmsFull = renderLlmsFullTxt({
      baseUrl: placeholderBaseUrl,
      pages: llmsPages,
    });

    expect(readStaticAsset("llms.txt")).toBe(expectedLlms);
    expect(readStaticAsset("llms-full.txt")).toBe(expectedLlmsFull);
    expect(readStaticAsset("ai.txt")).toBe(expectedLlms);
  });

  it("keeps key URL lists and brand/entity fields synchronized in runtime responses", () => {
    const runtimeLlms = renderLlmsTxt({
      allowTraining: false,
      baseUrl: "https://example.com",
      pages: llmsPages,
    });
    const runtimeLlmsFull = renderLlmsFullTxt({
      baseUrl: "https://example.com",
      pages: llmsPages,
    });

    expect(runtimeLlms).toContain(`# ${LLM_BRAND.name}`);
    expect(runtimeLlms).toContain(`Allow training: no`);
    expect(runtimeLlmsFull).toContain(`Primary domain intent: ${LLM_BRAND.primaryIntent}`);
    expect(runtimeLlmsFull).toContain(`Primary region: ${LLM_BRAND.primaryRegion}.`);

    LLM_KEY_PUBLIC_PATHS.forEach((routePath) => {
      const absoluteUrl = `https://example.com${routePath === "/" ? "/" : routePath}`;
      expect(runtimeLlms).toContain(absoluteUrl);
      expect(runtimeLlmsFull).toContain(absoluteUrl);
    });
  });
});
