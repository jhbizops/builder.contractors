import { describe, expect, it } from "vitest";
import {
  getLocalizedMarketingPath,
  getMarketingAlternateLinks,
  marketingLocales,
  resolveMarketingLocaleFromPath,
} from "@/content/locales";

describe("marketing locale helpers", () => {
  it("resolves marketing locale prefixes from paths", () => {
    const usLocale = resolveMarketingLocaleFromPath("/us");
    const ukLocale = resolveMarketingLocaleFromPath("/uk/about");

    expect(usLocale?.locale).toBe("en-US");
    expect(ukLocale?.locale).toBe("en-GB");
    expect(resolveMarketingLocaleFromPath("/pricing")).toBeNull();
  });

  it("builds localized marketing paths", () => {
    expect(getLocalizedMarketingPath("/us", "/")).toBe("/us");
    expect(getLocalizedMarketingPath("/us", "/about")).toBe("/us/about");
  });

  it("builds alternate links for marketing pages", () => {
    const alternates = getMarketingAlternateLinks("/about");

    expect(alternates[0]).toEqual({ hrefLang: "x-default", href: "/about" });
    const localeLinks = alternates.slice(1).map((link) => link.hrefLang);
    expect(localeLinks).toEqual(marketingLocales.map((locale) => locale.hreflang));
  });
});
