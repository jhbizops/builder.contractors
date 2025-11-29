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
export const GEO_LOOKUP_TIMEOUT_MS = 2500;

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^::1$/,
  /^fc00:/i,
  /^fd00:/i,
];

const US_FALLBACK = findCountryByCode("US").country ?? supportedCountries[0]!;

export function extractIp(request: Request): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]!.split(",")[0]!.trim();
  }

  return request.ip;
}

export function isPrivateIp(ip: string | null | undefined): boolean {
  if (!ip) {
    return true;
  }

  const normalized = ip.trim();
  if (!normalized) {
    return true;
  }

  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(normalized));
}

async function fetchGeoResponse(ip: string): Promise<IpApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEO_LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ipapi failure: ${response.status}`);
    }

    const data = (await response.json()) as IpApiResponse;
    if (data.error) {
      throw new Error(`ipapi error: ${data.reason ?? "unknown"}`);
    }

    return data;
  } catch (error) {
    const isAbortError =
      error instanceof DOMException
        ? error.name === "AbortError"
        : error instanceof Error && error.name === "AbortError";
    if (isAbortError) {
      throw new Error("ipapi-timeout");
    }

    // Silently fall back on any network error (DNS, connection refused, etc)
    if (error instanceof Error && error.message.includes("getaddrinfo")) {
      throw new Error("ipapi-network-error");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function lookupCountry(ip: string): Promise<SupportedCountry> {
  const now = Date.now();
  if (isPrivateIp(ip)) {
    cache.set(ip, { country: US_FALLBACK, expiresAt: now + CACHE_TTL });
    return US_FALLBACK;
  }

  const cached = cache.get(ip);
  if (cached && cached.expiresAt > now) {
    return cached.country;
  }

  const data = await fetchGeoResponse(ip);

  const code = data.country_code ?? data.country;
  const { country } = findCountryByCode(code);

  if (!country) {
    throw new Error(`unsupported-country:${code ?? "unknown"}`);
  }

  cache.set(ip, { country, expiresAt: now + CACHE_TTL });
  return country;
}

export function clearGeoCache() {
  cache.clear();
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

      // Silently fall back on any error (network, timeout, etc)
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg && (errorMsg.includes("ipapi") || errorMsg.includes("getaddrinfo"))) {
        // Network-level errors are expected in some environments, silently use fallback
        country = US_FALLBACK;
      } else {
        country = US_FALLBACK;
      }
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
