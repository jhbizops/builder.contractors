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
];
