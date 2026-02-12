import { describe, expect, it } from "vitest";
import { geoPages } from "@/content/geoPages";
import {
  buildFaqPageStructuredData,
  buildOrganizationWebsiteStructuredData,
  buildProductStructuredData,
} from "../structuredData";

describe("structured data helpers", () => {
  it("builds FAQPage JSON-LD from static FAQ entries", () => {
    const data = buildFaqPageStructuredData(geoPages.faq.faqs);

    expect(data["@type"]).toBe("FAQPage");
    const entities = data.mainEntity as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(geoPages.faq.faqs.length);
    expect(entities[0]?.name).toBe(geoPages.faq.faqs[0]?.question);
  });

  it("builds Product JSON-LD with offers for each pricing tier", () => {
    const tiers = geoPages.pricing.tiers ?? [];
    const data = buildProductStructuredData(tiers, geoPages.pricing.title, geoPages.pricing.summary);

    expect(data["@type"]).toBe("Product");
    const offers = data.offers as Array<Record<string, unknown>>;
    expect(offers).toHaveLength(tiers.length);
    expect(offers[0]?.name).toBe(tiers[0]?.name);
    expect(offers[0]?.price).toBe(tiers[0]?.priceLabel);
  });

  it("creates a combined Organization/WebSite/WebPage graph for the homepage", () => {
    const data = buildOrganizationWebsiteStructuredData(geoPages.home.title, geoPages.home.summary);
    const graph = data["@graph"] as Array<Record<string, unknown>>;

    expect(graph).toHaveLength(4);
    expect(graph[0]?.["@type"]).toBe("Organization");
    expect(graph[1]?.["@type"]).toBe("WebSite");
    expect(graph[2]?.["@type"]).toBe("WebPage");
    expect(graph[3]?.["@type"]).toBe("Service");
    expect((graph[1]?.potentialAction as Record<string, unknown>)?.["@type"]).toBe("SearchAction");
  });
});
