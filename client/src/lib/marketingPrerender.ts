import { geoPages, getGeoPageContent, type GeoPageKey } from "@/content/geoPages";
import {
  getLocalizedMarketingPath,
  getMarketingAlternateLinks,
  marketingLocales,
  marketingPageSlugs,
  type MarketingLocale,
} from "@/content/locales";
import {
  buildFaqPageStructuredData,
  buildOrganizationWebsiteStructuredData,
  buildProductStructuredData,
  buildServicePageStructuredData,
} from "@/lib/structuredData";

const DEFAULT_ROBOTS_CONTENT = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

const pageKeyBySlug: Record<string, GeoPageKey> = Object.entries(geoPages).reduce(
  (acc, [pageKey, content]) => ({
    ...acc,
    [content.slug]: pageKey as GeoPageKey,
  }),
  {} as Record<string, GeoPageKey>,
);

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const jsonLdScript = (id: string, data: Record<string, unknown>): string =>
  `<script type="application/ld+json" data-prerender-structured-data="${id}">${JSON.stringify(data)}</script>`;

export type MarketingRenderPage = {
  slug: string;
  canonicalPath: string;
  pageKey: GeoPageKey;
  locale: MarketingLocale | null;
};

export const getMarketingRenderPages = (): MarketingRenderPage[] => {
  const basePages = marketingPageSlugs.map((slug) => {
    const pageKey = pageKeyBySlug[slug];
    if (!pageKey) {
      throw new Error(`No marketing prerender page key registered for slug: ${slug}`);
    }
    return {
      slug,
      canonicalPath: slug,
      pageKey,
      locale: null,
    };
  });

  const localizedPages = marketingLocales.flatMap((locale) =>
    marketingPageSlugs.map((slug) => {
      const pageKey = pageKeyBySlug[slug];
      if (!pageKey) {
        throw new Error(`No marketing prerender page key registered for slug: ${slug}`);
      }
      return {
        slug,
        canonicalPath: getLocalizedMarketingPath(locale.prefix, slug),
        pageKey,
        locale,
      };
    }),
  );

  return [...basePages, ...localizedPages];
};

export const buildMarketingHeadMarkup = (page: MarketingRenderPage, baseUrl: string): string => {
  const content = getGeoPageContent(page.pageKey, page.locale?.locale);
  const canonicalUrl = new URL(page.canonicalPath, baseUrl).toString();
  const keywords = content.keywords.join(", ");
  const alternateLinks = getMarketingAlternateLinks(page.slug);
  const organizationStructuredData = buildOrganizationWebsiteStructuredData(content.title, content.summary, baseUrl);
  const serviceStructuredData = buildServicePageStructuredData(content, page.canonicalPath);

  const structuredDataScripts: string[] = [
    jsonLdScript("organization", organizationStructuredData),
    jsonLdScript("service", serviceStructuredData),
  ];

  if (content.faqs.length > 0) {
    structuredDataScripts.push(jsonLdScript("faq", buildFaqPageStructuredData(content.faqs)));
  }

  if (content.tiers?.length) {
    structuredDataScripts.push(
      jsonLdScript("product", buildProductStructuredData(content.tiers, content.title, content.summary)),
    );
  }

  const alternateMarkup = alternateLinks
    .map((alternate) => {
      const href = new URL(alternate.href, baseUrl).toString();
      return `<link rel="alternate" hreflang="${escapeHtml(alternate.hrefLang)}" href="${escapeHtml(href)}" data-prerender-head="true" />`;
    })
    .join("\n");

  return [
    `<title>${escapeHtml(content.title)}</title>`,
    `<meta name="title" content="${escapeHtml(content.title)}" data-prerender-head="true" />`,
    `<meta name="description" content="${escapeHtml(content.summary)}" data-prerender-head="true" />`,
    `<meta name="keywords" content="${escapeHtml(keywords)}" data-prerender-head="true" />`,
    `<meta name="robots" content="${escapeHtml(DEFAULT_ROBOTS_CONTENT)}" data-prerender-head="true" />`,
    `<meta name="googlebot" content="${escapeHtml(DEFAULT_ROBOTS_CONTENT)}" data-prerender-head="true" />`,
    `<meta name="bingbot" content="${escapeHtml(DEFAULT_ROBOTS_CONTENT)}" data-prerender-head="true" />`,
    `<meta property="og:type" content="website" data-prerender-head="true" />`,
    `<meta property="og:site_name" content="Builder.Contractors" data-prerender-head="true" />`,
    `<meta property="og:title" content="${escapeHtml(content.title)}" data-prerender-head="true" />`,
    `<meta property="og:description" content="${escapeHtml(content.summary)}" data-prerender-head="true" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" data-prerender-head="true" />`,
    `<meta property="og:image" content="${escapeHtml(`${baseUrl}/og-image.jpg`)}" data-prerender-head="true" />`,
    `<meta name="twitter:card" content="summary_large_image" data-prerender-head="true" />`,
    `<meta name="twitter:title" content="${escapeHtml(content.title)}" data-prerender-head="true" />`,
    `<meta name="twitter:description" content="${escapeHtml(content.summary)}" data-prerender-head="true" />`,
    `<meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" data-prerender-head="true" />`,
    `<meta name="twitter:image" content="${escapeHtml(`${baseUrl}/twitter-image.jpg`)}" data-prerender-head="true" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" data-prerender-head="true" />`,
    alternateMarkup,
    ...structuredDataScripts,
  ]
    .filter(Boolean)
    .join("\n");
};

export const injectMarketingHead = (html: string, headMarkup: string): string => {
  const managedTagPatterns = [
    /<title>[\s\S]*?<\/title>/gi,
    /<meta[^>]+(?:name|property)="(?:title|description|keywords|robots|googlebot|bingbot|twitter:[^"]+|og:[^"]+)"[^>]*>/gi,
    /<link[^>]+rel="canonical"[^>]*>/gi,
    /<link[^>]+rel="alternate"[^>]*hreflang="[^"]+"[^>]*>/gi,
    /<script[^>]+type="application\/ld\+json"[\s\S]*?<\/script>/gi,
  ];

  const sanitized = managedTagPatterns.reduce((current, pattern) => current.replace(pattern, ""), html);
  return sanitized.replace("</head>", `${headMarkup}\n</head>`);
};
