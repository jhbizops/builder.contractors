import type { Request, Response, NextFunction } from "express";
import type { Session, SessionData } from "express-session";
import type { SupportedCountry } from "../countries/service";
import {
  findCountryByCode,
  formatCountryPayload,
  supportedCountries,
} from "../countries/service";

interface IpApiResponse {
  readonly country?: string;
  readonly country_code?: string;
  readonly currency?: string;
  readonly languages?: string;
  readonly error?: boolean;
  readonly reason?: string;
}

interface GeoCacheEntry {
  readonly country: SupportedCountry;
  readonly expiresAt: number;
}

const cache = new Map<string, GeoCacheEntry>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

const US_FALLBACK = findCountryByCode("US").country ?? supportedCountries[0]!;

function extractIp(request: Request): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]!.split(",")[0]!.trim();
  }

  return request.ip;
}

async function lookupCountry(ip: string): Promise<SupportedCountry> {
  const cached = cache.get(ip);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.country;
  }

  const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`ipapi failure: ${response.status}`);
  }

  const data = (await response.json()) as IpApiResponse;
  if (data.error) {
    throw new Error(`ipapi error: ${data.reason ?? "unknown"}`);
  }

  const code = data.country_code ?? data.country;
  const { country } = findCountryByCode(code);

  if (!country) {
    throw new Error(`unsupported-country:${code ?? "unknown"}`);
  }

  cache.set(ip, { country, expiresAt: now + CACHE_TTL });
  return country;
}

type AugmentedSession = Session & SessionData;

function applySession(session: AugmentedSession, country: SupportedCountry) {
  session.countryCode = country.code;
  session.countryName = country.name;
  session.currency = country.currency;
  session.languages = [...country.languages];
  session.localize = country.localize;
  session.geoCheckedAt = Date.now();
}

export async function geoDetectionMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const existingCode = request.session.countryCode;
    if (existingCode) {
      const { country } = findCountryByCode(existingCode);
      if (country) {
        applySession(request.session as AugmentedSession, country);
        response.locals.country = formatCountryPayload(country);
        return next();
      }
    }

    const ip = extractIp(request);
    let country: SupportedCountry;

    try {
      country = await lookupCountry(ip);
    } catch (error) {
      const isUnsupported =
        error instanceof Error && error.message.startsWith("unsupported-country");
      if (isUnsupported) {
        blockRequest(response);
        return;
      }

      country = US_FALLBACK;
    }

    applySession(request.session as AugmentedSession, country);
    response.locals.country = formatCountryPayload(country);

    return next();
  } catch (error) {
    applySession(request.session as AugmentedSession, US_FALLBACK);
    response.locals.country = formatCountryPayload(US_FALLBACK);
    return next();
  }
}

export function blockRequest(response: Response) {
  const message = "Service not available in your region";
  if (response.headersSent) {
    return;
  }

  if (response.req.headers.accept?.includes("application/json")) {
    response.status(403).json({ message });
    return;
  }

  response.redirect(302, "/blocked?reason=region");
}
