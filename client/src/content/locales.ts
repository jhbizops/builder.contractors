import { countryMetadataByCode } from "@shared/countryMetadata";
import { geoPages } from "@/content/geoPages";

export type MarketingLocale = {
  locale: string;
  region: string;
  prefix: string;
  hreflang: string;
  countryName: string;
};

const localeEntries = [
  { locale: "en-US", region: "US", prefix: "/us", hreflang: "en-US" },
  { locale: "en-GB", region: "GB", prefix: "/uk", hreflang: "en-GB" },
  { locale: "en-AU", region: "AU", prefix: "/au", hreflang: "en-AU" },
] as const;

export const marketingLocales: MarketingLocale[] = localeEntries.map((entry) => {
  const country = countryMetadataByCode[entry.region];
  if (!country) {
    throw new Error(`Unknown region code for marketing locale: ${entry.region}`);
  }
  return {
    ...entry,
    countryName: country.name,
  };
});

export const marketingPageSlugs = Object.values(geoPages).map((page) => page.slug);

export const getLocalizedMarketingPath = (prefix: string, slug: string): string => {
  if (slug === "/") {
    return prefix;
  }
  return `${prefix}${slug}`;
};

export const resolveMarketingLocaleFromPath = (pathname: string): MarketingLocale | null => {
  const normalized = pathname.toLowerCase();
  return (
    marketingLocales.find((locale) => {
      const prefix = locale.prefix.toLowerCase();
      return normalized === prefix || normalized.startsWith(`${prefix}/`);
    }) ?? null
  );
};

export type MarketingAlternateLink = {
  hrefLang: string;
  href: string;
};

export const getMarketingAlternateLinks = (slug: string): MarketingAlternateLink[] => [
  { hrefLang: "x-default", href: slug },
  ...marketingLocales.map((locale) => ({
    hrefLang: locale.hreflang,
    href: getLocalizedMarketingPath(locale.prefix, slug),
  })),
];

export const resolveMarketingCanonical = (pathname: string, slug: string) => {
  const locale = resolveMarketingLocaleFromPath(pathname);
  const canonicalPath = locale ? getLocalizedMarketingPath(locale.prefix, slug) : slug;
  return {
    locale,
    canonicalPath,
    alternates: getMarketingAlternateLinks(slug),
  };
};
