export type SitemapRoute = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
};

export const sitemapRoutes: SitemapRoute[] = [
  {
    path: "/",
    changefreq: "weekly",
    priority: 1.0,
  },
  {
    path: "/login",
    changefreq: "monthly",
    priority: 0.4,
  },
  {
    path: "/register",
    changefreq: "monthly",
    priority: 0.4,
  },
  {
    path: "/about",
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    path: "/how-it-works",
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    path: "/faq",
    changefreq: "monthly",
    priority: 0.5,
  },
  {
    path: "/pricing",
    changefreq: "monthly",
    priority: 0.6,
  },
];
