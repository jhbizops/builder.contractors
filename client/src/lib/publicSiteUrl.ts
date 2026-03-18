import { DEFAULT_PUBLIC_SITE_ORIGIN, toPublicSiteOrigin } from "@shared/publicSiteUrl";

const readPublicSiteUrlFromEnv = (): string | undefined => {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return env?.PUBLIC_SITE_URL;
};

export const getCanonicalSiteOrigin = (windowOrigin?: string): string => {
  const configured = toPublicSiteOrigin(readPublicSiteUrlFromEnv() ?? "");
  if (configured) {
    return configured;
  }

  const originFromWindow = windowOrigin ? toPublicSiteOrigin(windowOrigin) : null;
  if (originFromWindow) {
    return originFromWindow;
  }

  return DEFAULT_PUBLIC_SITE_ORIGIN;
};
