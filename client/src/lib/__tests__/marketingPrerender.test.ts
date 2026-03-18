import { describe, expect, it } from "vitest";
import { buildMarketingHeadMarkup, getMarketingRenderPages, injectMarketingHead } from "@/lib/marketingPrerender";

describe("marketing prerender helpers", () => {
  it("creates localized marketing routes including /au/about", () => {
    const pages = getMarketingRenderPages();
    expect(pages.some((page) => page.canonicalPath === "/")).toBe(true);
    expect(pages.some((page) => page.canonicalPath === "/au/about" && page.locale?.locale === "en-AU")).toBe(true);
  });

  it("builds SEO tags and JSON-LD for pricing page", () => {
    const headMarkup = buildMarketingHeadMarkup(
      {
        slug: "/pricing",
        canonicalPath: "/pricing",
        pageKey: "pricing",
        locale: null,
      },
      "https://www.builder.contractors",
    );

    expect(headMarkup).toContain("<title>Pricing for Builder.Contractors</title>");
    expect(headMarkup).toContain('rel="canonical" href="https://www.builder.contractors/pricing"');
    expect(headMarkup).toContain('"@type":"Product"');
    expect(headMarkup).toContain('"@type":"Service"');
  });

  it("replaces managed head tags while preserving unrelated head content", () => {
    const template = [
      "<html><head>",
      "<meta charset=\"UTF-8\" />",
      "<title>Old</title>",
      "<meta name=\"description\" content=\"old\" />",
      "<link rel=\"canonical\" href=\"https://old.example\" />",
      "<script type=\"application/ld+json\">{\"old\":true}</script>",
      "<link rel=\"stylesheet\" href=\"/assets/app.css\" />",
      "</head><body></body></html>",
    ].join("");

    const output = injectMarketingHead(
      template,
      '<title>New</title>\n<meta name="description" content="new" data-prerender-head="true" />',
    );

    expect(output).toContain("<meta charset=\"UTF-8\" />");
    expect(output).toContain("<link rel=\"stylesheet\" href=\"/assets/app.css\" />");
    expect(output).toContain("<title>New</title>");
    expect(output).not.toContain("<title>Old</title>");
    expect(output).not.toContain('href="https://old.example"');
  });
});
