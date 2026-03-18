const DEFAULT_PUBLIC_SITE_URL = "https://www.builder.contractors";

export const DEFAULT_PUBLIC_SITE_ORIGIN = new URL(DEFAULT_PUBLIC_SITE_URL).origin;

export const toPublicSiteOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

export const resolvePublicSiteOrigin = (value: string | undefined): string => {
  if (!value) {
    return DEFAULT_PUBLIC_SITE_ORIGIN;
  }

  return toPublicSiteOrigin(value) ?? DEFAULT_PUBLIC_SITE_ORIGIN;
};
