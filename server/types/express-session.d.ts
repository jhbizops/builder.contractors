import type { User } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    countryCode?: string;
    countryName?: string;
    currency?: string;
    languages?: string[];
    localize?: boolean;
    geoCheckedAt?: number;
    analyticsTagged?: boolean;
    userId?: string;
    userRole?: string;
  }
}

declare global {
  namespace Express {
    interface Locals {
      authenticatedUser?: User;
    }
  }
}
