import { describe, expect, it } from "vitest";
import { sitemapRoutes } from "../../client/src/content/routes";
import { getMarketingRenderPages } from "../../client/src/lib/marketingPrerender";
import {
  assertSitemapRoutesHaveStaticHtml,
  normalizeRoutePath,
  staticHtmlFilePathFromRoute,
} from "../../scripts/prerender-public";

describe("public prerender sitemap coverage", () => {
  it("ensures every sitemap route has a prerendered static output mapping", () => {
    const pages = getMarketingRenderPages();
    expect(() => assertSitemapRoutesHaveStaticHtml(sitemapRoutes, pages)).not.toThrow();
  });

  it("maps sitemap route paths to deterministic index.html files", () => {
    const uniquePaths = new Set<string>();

    sitemapRoutes.forEach((route) => {
      const normalized = normalizeRoutePath(route.path);
      const filePath = staticHtmlFilePathFromRoute(route.path, "/tmp/dist/public");

      if (normalized === "/") {
        expect(filePath).toBe("/tmp/dist/public/index.html");
      } else {
        expect(filePath).toBe(`/tmp/dist/public/${normalized.replace(/^\//, "")}/index.html`);
      }

      uniquePaths.add(filePath);
    });

    expect(uniquePaths.size).toBe(sitemapRoutes.length);
  });
});
