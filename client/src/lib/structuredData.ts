import type { GeoPageFaq, GeoPageContent } from "@/content/geoPages";

type PricingTier = NonNullable<GeoPageContent["tiers"]>[number];

type JsonLdValue = Record<string, unknown>;

const SCHEMA_CONTEXT = "https://schema.org";
const BASE_URL = "https://www.builder.contractors";

export const buildFaqPageStructuredData = (faqs: GeoPageFaq[]): JsonLdValue => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});

export const buildProductStructuredData = (tiers: PricingTier[], name: string, description: string): JsonLdValue => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "Product",
  name,
  description,
  offers: tiers.map((tier) => ({
    "@type": "Offer",
    name: tier.name,
    description: tier.description,
    price: tier.priceLabel,
  })),
});

export const buildOrganizationWebsiteStructuredData = (
  title: string,
  description: string,
  url: string = BASE_URL,
): JsonLdValue => ({
  "@context": SCHEMA_CONTEXT,
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${url}/#organization`,
      name: "Builder.Contractors",
      url: `${url}/`,
      logo: `${url}/og-image.jpg`,
      description,
      sameAs: [],
      areaServed: "Global",
    },
    {
      "@type": "WebSite",
      "@id": `${url}/#website`,
      url: `${url}/`,
      name: "Builder.Contractors",
      description,
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: `${url}/faq`,
      },
    },
    {
      "@type": "WebPage",
      "@id": `${url}/#webpage`,
      url: `${url}/`,
      name: title,
      description,
      isPartOf: {
        "@id": `${url}/#website`,
      },
      about: {
        "@id": `${url}/#organization`,
      },
    },
    {
      "@type": "Service",
      "@id": `${url}/#service`,
      name: "Builder and contractor lead exchange network",
      serviceType: "Lead exchange and contractor collaboration",
      provider: {
        "@id": `${url}/#organization`,
      },
      areaServed: "Global",
      audience: {
        "@type": "BusinessAudience",
        audienceType: "Builders and contractors",
      },
      description,
    },
  ],
});
