import { getLocalizedMarketingPath, getMarketingAlternateLinks, marketingLocales, marketingPageSlugs } from "./locales";

export type SitemapRoute = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
  alternates?: Array<{
    hreflang: string;
    path: string;
  }>;
};

const marketingRouteSettings: Record<
  string,
  {
    changefreq: SitemapRoute["changefreq"];
    priority: number;
  }
> = {
  "/": { changefreq: "weekly", priority: 1.0 },
  "/about": { changefreq: "monthly", priority: 0.6 },
  "/how-it-works": { changefreq: "monthly", priority: 0.6 },
  "/faq": { changefreq: "monthly", priority: 0.5 },
  "/pricing": { changefreq: "monthly", priority: 0.6 },
  "/lead-exchange-workflow": { changefreq: "weekly", priority: 0.8 },
  "/partner-verification": { changefreq: "weekly", priority: 0.8 },
  "/multi-region-handoff-governance": { changefreq: "weekly", priority: 0.8 },
  "/lead-routing-signals": { changefreq: "monthly", priority: 0.7 },
  "/verification-evidence-checklist": { changefreq: "monthly", priority: 0.7 },
  "/regional-handoff-playbooks": { changefreq: "monthly", priority: 0.7 },
};

const marketingRoutes = marketingPageSlugs.flatMap((slug) => {
  const settings = marketingRouteSettings[slug];
  if (!settings) {
    return [];
  }
  const alternates = getMarketingAlternateLinks(slug).map((link) => ({
    hreflang: link.hrefLang,
    path: link.href,
  }));

  const baseRoute: SitemapRoute = {
    path: slug,
    changefreq: settings.changefreq,
    priority: settings.priority,
    alternates,
  };

  const localeRoutes: SitemapRoute[] = marketingLocales.map((locale) => ({
    path: getLocalizedMarketingPath(locale.prefix, slug),
    changefreq: settings.changefreq,
    priority: settings.priority,
    alternates,
  }));

  return [baseRoute, ...localeRoutes];
});

export const sitemapRoutes: SitemapRoute[] = [
  ...marketingRoutes,
];
