declare module "express-session" {
  interface SessionData {
    countryCode?: string;
    countryName?: string;
    currency?: string;
    languages?: string[];
    localize?: boolean;
    geoCheckedAt?: number;
    analyticsTagged?: boolean;
  }
}
