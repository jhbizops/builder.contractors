import { describe, expect, it } from "vitest";
import { geoPages } from "@/content/geoPages";
import {
  buildFaqPageStructuredData,
  buildOrganizationWebsiteStructuredData,
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

  it("builds service page graph with Service, FAQPage and BreadcrumbList", () => {
    const data = buildServicePageStructuredData(geoPages.pricing, geoPages.pricing.slug);
    const graph = data["@graph"] as Array<Record<string, unknown>>;

    expect(graph[0]?.["@type"]).toBe("BreadcrumbList");
    expect(graph[1]?.["@type"]).toBe("WebPage");
    expect(graph[2]?.["@type"]).toBe("Service");
    expect((graph[2]?.areaServed as Array<unknown>).length).toBeGreaterThan(0);
    expect(graph[3]?.["@type"]).toBe("FAQPage");
    const offers = graph[2]?.offers as Array<Record<string, unknown>>;
    expect(offers).toHaveLength(3);
    expect(offers[0]).toMatchObject({ name: "Starter", price: "0.00", priceCurrency: "AUD" });
    expect(offers[1]).toMatchObject({
      name: "Growth",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "99.00", priceCurrency: "AUD", unitCode: "MON" },
    });
    expect(offers[2]).toMatchObject({ name: "Enterprise" });
    expect(offers[2]).not.toHaveProperty("price");
    expect(offers[2]).not.toHaveProperty("priceSpecification");
    expect(graph[2]).not.toHaveProperty("minimumCharge");
  });

  it.each(["Custom", "Contact us", "From $99", "$99 - $199", "$99 or more", "not priced"]) (
    "does not invent a price for ambiguous label %s",
    (priceLabel) => {
      const tier = { name: "Example", priceLabel, description: "Quote", features: [] };
      const data = buildServicePageStructuredData({ ...geoPages.pricing, tiers: [tier] }, "/pricing");
      const service = (data["@graph"] as Array<Record<string, unknown>>).find((node) => node["@type"] === "Service");
      const offer = (service?.offers as Array<Record<string, unknown>>)[0];
      expect(offer).not.toHaveProperty("price");
      expect(offer).not.toHaveProperty("priceSpecification");
    },
  );

  it("creates a coherent homepage graph around construction referral workflows", () => {
    const homeFaqs = [
      {
        question: "Who can join Builder.Contractors?",
        answer:
          "Builder.Contractors is designed for licensed builders and qualified contractors exchanging trusted referrals.",
      },
    ];
    const data = buildOrganizationWebsiteStructuredData(
      geoPages.home.title,
      geoPages.home.summary,
      undefined,
      homeFaqs,
    );
    const graph = data["@graph"] as Array<Record<string, unknown>>;

    expect(graph.length).toBeGreaterThanOrEqual(7);
    expect(graph.some((node) => node["@type"] === "Organization")).toBe(true);
    expect(graph.some((node) => node["@type"] === "Person")).toBe(true);
    expect(graph.some((node) => node["@type"] === "WebSite")).toBe(true);
    expect(graph.some((node) => node["@type"] === "Service")).toBe(true);
    expect(graph.some((node) => node["@type"] === "Article")).toBe(true);
    expect(graph.some((node) => node["@type"] === "SoftwareApplication")).toBe(true);
    expect(graph.some((node) => node["@type"] === "FAQPage")).toBe(true);

    const personNode = graph.find((node) => node["@type"] === "Person");
    expect(personNode?.jobTitle).toBe("Construction Referral Workflow Lead");
  });
});
