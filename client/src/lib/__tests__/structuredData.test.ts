import { describe, expect, it } from "vitest";
import { geoPages } from "@/content/geoPages";
import {
  buildFaqPageStructuredData,
  buildOrganizationWebsiteStructuredData,
  buildProductStructuredData,
  buildServicePageStructuredData,
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
    expect(offers[1]?.price).toBe("99.00");
  });

  it("builds service page graph with Service, FAQPage and BreadcrumbList", () => {
    const data = buildServicePageStructuredData(geoPages.pricing, geoPages.pricing.slug);
    const graph = data["@graph"] as Array<Record<string, unknown>>;

    expect(graph[0]?.["@type"]).toBe("BreadcrumbList");
    expect(graph[1]?.["@type"]).toBe("WebPage");
    expect(graph[2]?.["@type"]).toBe("Service");
    expect((graph[2]?.areaServed as Array<unknown>).length).toBeGreaterThan(0);
    expect(graph[3]?.["@type"]).toBe("FAQPage");
  });

  it("creates an expanded homepage graph with organization, legal service and ratings", () => {
    const data = buildOrganizationWebsiteStructuredData(geoPages.home.title, geoPages.home.summary);
    const graph = data["@graph"] as Array<Record<string, unknown>>;

    expect(graph.length).toBeGreaterThanOrEqual(10);
    expect(graph.some((node) => node["@type"] === "Organization")).toBe(true);
    expect(graph.some((node) => node["@type"] === "LocalBusiness")).toBe(true);
    expect(graph.some((node) => node["@type"] === "ProfessionalService")).toBe(true);
    expect(graph.some((node) => node["@type"] === "Person")).toBe(true);
    expect(graph.some((node) => node["@type"] === "AggregateRating")).toBe(true);
    expect(graph.some((node) => node["@type"] === "Article")).toBe(true);
    expect(graph.some((node) => node["@type"] === "SoftwareApplication")).toBe(true);
  });
});
