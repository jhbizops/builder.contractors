import type { GeoPageFaq, GeoPageContent } from "@/content/geoPages";
import { DEFAULT_PUBLIC_SITE_ORIGIN } from "@shared/publicSiteUrl";
import { getCanonicalSiteOrigin } from "@/lib/publicSiteUrl";

type PricingTier = NonNullable<GeoPageContent["tiers"]>[number];
type HomeFaqEntry = {
  question: string;
  answer: string;
};

type JsonLdValue = Record<string, unknown>;

const SCHEMA_CONTEXT = "https://schema.org";
const BASE_URL = DEFAULT_PUBLIC_SITE_ORIGIN;


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

export const buildServicePageStructuredData = (
  page: GeoPageContent,
  path: string,
  baseUrl: string = getCanonicalSiteOrigin(),
): JsonLdValue => {
  const organizationId = `${baseUrl}/#organization`;
  const websiteId = `${baseUrl}/#website`;
  const offers = (page.tiers ?? []).map(defaultOfferForTier);
  const pageId = `${baseUrl}${path}#webpage`;
  const serviceId = `${baseUrl}${path}#service`;
  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: page.title, item: `${baseUrl}${path}` },
        ],
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url: `${baseUrl}${path}`,
        name: page.title,
        description: page.summary,
        isPartOf: { "@id": websiteId },
        about: { "@id": organizationId },
      },
      {
        "@type": "Service",
        "@id": serviceId,
        name: page.title,
        description: page.summary,
        provider: { "@id": organizationId },
        areaServed: [
          { "@type": "AdministrativeArea", name: "NSW" },
          { "@type": "Country", name: "Australia" },
          { "@type": "Place", name: "Global" },
        ],
        availableChannel: {
          "@type": "ServiceChannel",
          serviceUrl: `${baseUrl}${path}`,
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
            "@id": `${baseUrl}${path}#faq`,
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
  url: string = getCanonicalSiteOrigin(),
  homeFaqs: HomeFaqEntry[] = [],
): JsonLdValue => {
  const organizationId = `${url}/#organization`;
  const personId = `${url}/#principal`;
  const websiteId = `${url}/#website`;
  const primaryDomainIntent = "Construction referral and workflow coordination for verified builder and contractor teams";

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
      slogan: primaryDomainIntent,
      knowsAbout: ["Construction referrals", "Lead handoff workflows", "Builder-contractor collaboration"],
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
      name: "Principal Operations Lead, Builder.Contractors",
      jobTitle: "Construction Referral Workflow Lead",
      worksFor: { "@id": organizationId },
      knowsAbout: [
        "Construction referral routing",
        "Builder-contractor partner qualification",
        "Project handoff workflows",
      ],
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: `${url}/`,
      name: "Builder.Contractors",
      description: primaryDomainIntent,
      inLanguage: "en",
      about: { "@id": `${url}/#service` },
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
      name: "Construction referral and workflow coordination",
      serviceType: primaryDomainIntent,
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
      applicationSubCategory: primaryDomainIntent,
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        priceCurrency: "AUD",
        price: "0",
      },
      publisher: { "@id": organizationId },
      description: primaryDomainIntent,
      featureList: [
        "Verified partner onboarding",
        "Lead handoff workflow",
        "Role-based collaboration",
        "Regional routing and reporting",
      ],
    },
    ...(homeFaqs.length > 0
      ? [
          {
            "@type": "FAQPage",
            "@id": `${url}/#faq-home`,
            mainEntityOfPage: { "@id": `${url}/#webpage` },
            mainEntity: homeFaqs.map((faq) => ({
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
