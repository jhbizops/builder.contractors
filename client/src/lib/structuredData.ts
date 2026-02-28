import type { GeoPageFaq, GeoPageContent } from "@/content/geoPages";

type PricingTier = NonNullable<GeoPageContent["tiers"]>[number];

type JsonLdValue = Record<string, unknown>;

const SCHEMA_CONTEXT = "https://schema.org";
const BASE_URL = "https://www.builder.contractors";

const ORGANIZATION_ID = `${BASE_URL}/#organization`;
const WEBSITE_ID = `${BASE_URL}/#website`;

const parsePrice = (priceLabel: string): string | undefined => {
  const match = priceLabel.match(/\$([\d,.]+)/);
  return match ? Number.parseFloat(match[1].replace(/,/g, "")).toFixed(2) : undefined;
};

const defaultOfferForTier = (tier: PricingTier): JsonLdValue => {
  const parsedPrice = parsePrice(tier.priceLabel);
  return {
    "@type": "Offer",
    name: tier.name,
    description: tier.description,
    priceCurrency: "AUD",
    ...(parsedPrice ? { price: parsedPrice } : { priceSpecification: { "@type": "PriceSpecification", priceCurrency: "AUD", price: 0, description: tier.priceLabel } }),
    availability: "https://schema.org/InStock",
    category: "Subscription",
  };
};

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

export const buildServicePageStructuredData = (page: GeoPageContent, path: string): JsonLdValue => {
  const offers = (page.tiers ?? []).map(defaultOfferForTier);
  const pageId = `${BASE_URL}${path}#webpage`;
  const serviceId = `${BASE_URL}${path}#service`;
  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
          { "@type": "ListItem", position: 2, name: page.title, item: `${BASE_URL}${path}` },
        ],
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url: `${BASE_URL}${path}`,
        name: page.title,
        description: page.summary,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "Service",
        "@id": serviceId,
        name: page.title,
        description: page.summary,
        provider: { "@id": ORGANIZATION_ID },
        areaServed: [
          { "@type": "AdministrativeArea", name: "NSW" },
          { "@type": "Country", name: "Australia" },
          { "@type": "Place", name: "Global" },
        ],
        availableChannel: {
          "@type": "ServiceChannel",
          serviceUrl: `${BASE_URL}${path}`,
          availableLanguage: ["en-AU", "en-US", "en-GB"],
        },
        mainEntityOfPage: { "@id": pageId },
        ...(offers.length > 0
          ? {
              offers,
              minimumCharge: {
                "@type": "MonetaryAmount",
                currency: "AUD",
                value: parsePrice(page.tiers?.[1]?.priceLabel ?? "") ?? "99.00",
              },
              priceRange: "Free - Custom",
            }
          : {}),
      },
      ...(page.faqs.length > 0
        ? [
          {
            "@type": "FAQPage",
            "@id": `${BASE_URL}${path}#faq`,
            mainEntityOfPage: { "@id": pageId },
            mainEntity: page.faqs.map((faq) => ({
              "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };
};

export const buildProductStructuredData = (tiers: PricingTier[], name: string, description: string): JsonLdValue => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "Product",
  name,
  description,
  offers: tiers.map(defaultOfferForTier),
});

export const buildOrganizationWebsiteStructuredData = (
  title: string,
  description: string,
  url: string = BASE_URL,
): JsonLdValue => {
  const organizationId = `${url}/#organization`;
  const personId = `${url}/#principal`;
  const websiteId = `${url}/#website`;

  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "Builder.Contractors",
      url: `${url}/`,
      logo: `${url}/og-image.jpg`,
      description,
      sameAs: ["https://elyment.com.au"],
      areaServed: ["NSW", "Australia", "Global"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: ["en-AU", "en-US", "en-GB"],
        url: `${url}/faq`,
      },
    },
    {
      "@type": "Person",
      "@id": personId,
      name: "Principal Solicitor, Builder.Contractors",
      jobTitle: "Principal Legal & Compliance Lead",
      worksFor: { "@id": organizationId },
      knowsAbout: ["Conveyancing", "Construction compliance", "Contract risk management"],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${url}/#localbusiness`,
      name: "Builder.Contractors Australia",
      url: `${url}/`,
      priceRange: "Free - Custom",
      telephone: "+61-2-0000-0000",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sydney",
        addressRegion: "NSW",
        addressCountry: "AU",
      },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${url}/#professional-service`,
      name: "Builder.Contractors Professional Services",
      serviceType: "Builder and contractor partner coordination",
      areaServed: ["NSW", "Australia", "Global"],
      provider: { "@id": organizationId },
    },
    {
      "@type": "Review",
      "@id": `${url}/#review-1`,
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
      },
      author: {
        "@type": "Person",
        name: "Luca Marino",
      },
      reviewBody: "Referrals outside our service area are now handled with consistent quality.",
      itemReviewed: { "@id": `${url}/#service` },
    },
    {
      "@type": "AggregateRating",
      "@id": `${url}/#aggregate-rating`,
      ratingValue: "4.9",
      reviewCount: "126",
      bestRating: "5",
      worstRating: "1",
      itemReviewed: { "@id": `${url}/#service` },
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
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
        "@id": websiteId,
      },
      about: {
        "@id": organizationId,
      },
    },
    {
      "@type": "Service",
      "@id": `${url}/#service`,
      name: "Builder and contractor lead exchange network",
      serviceType: "Lead exchange and contractor collaboration",
      provider: {
        "@id": organizationId,
      },
      areaServed: ["NSW", "Australia", "Global"],
      audience: {
        "@type": "BusinessAudience",
        audienceType: "Builders and contractors",
      },
      description,
      offers: {
        "@type": "Offer",
        category: "Subscription",
        priceCurrency: "AUD",
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: "0",
          priceCurrency: "AUD",
          description: "Starter tier available with enterprise upgrade options",
        },
      },
    },
    {
      "@type": "Article",
      "@id": `${url}/#article-home`,
      headline: title,
      description,
      author: { "@id": personId },
      publisher: { "@id": organizationId },
      mainEntityOfPage: { "@id": `${url}/#webpage` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${url}/#application`,
      name: "Builder.Contractors Platform",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        priceCurrency: "AUD",
        price: "0",
      },
      publisher: { "@id": organizationId },
      featureList: [
        "Verified partner onboarding",
        "Lead handoff workflow",
        "Role-based collaboration",
        "Regional routing and reporting",
      ],
    },
    ],
  };
};
