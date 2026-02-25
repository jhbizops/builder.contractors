import type { GeoPageFaq, GeoPageContent } from "@/content/geoPages";

type PricingTier = NonNullable<GeoPageContent["tiers"]>[number];

type JsonLdValue = Record<string, unknown>;

const SCHEMA_CONTEXT = "https://schema.org";
const BASE_URL = "https://www.builder.contractors";

const ORGANIZATION_ID = `${BASE_URL}/#organization`;
const PERSON_ID = `${BASE_URL}/#principal`;

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
        "@type": "Service",
        "@id": `${BASE_URL}${path}#service`,
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
      "@id": `${url}/#principal`,
      name: "Principal Solicitor, Builder.Contractors",
      jobTitle: "Principal Legal & Compliance Lead",
      worksFor: { "@id": `${url}/#organization` },
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
      provider: { "@id": `${url}/#organization` },
    },
    {
      "@type": "LegalService",
      "@id": `${url}/#conveyancing`,
      name: "Conveyancing Partner Enablement Service",
      serviceType: "Conveyancing workflow support for building projects",
      provider: { "@id": `${url}/#organization` },
      areaServed: ["NSW", "Australia"],
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: `${url}/how-it-works`,
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "AUD",
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: "250.00",
          priceCurrency: "AUD",
          description: "Minimum charge depends on service scope",
        },
      },
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
      author: { "@id": `${url}/#principal` },
      publisher: { "@id": `${url}/#organization` },
      mainEntityOfPage: { "@id": `${url}/#webpage` },
    },
  ],
});
