import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { supportedCountries } from "../countries/service";
import {
  GEO_LOOKUP_TIMEOUT_MS,
  clearGeoCache,
  extractIp,
  isPrivateIp,
  lookupCountry,
} from "./geoDetection";

const createFetchResponse = (json: object) =>
  ({
    ok: true,
    json: async () => json,
  }) as Response;

describe("geoDetection helpers", () => {
  beforeEach(() => {
    clearGeoCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts the first forwarded IP when multiple are provided", () => {
    const ip = extractIp({
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178" },
      ip: "198.51.100.1",
    } as unknown as Parameters<typeof extractIp>[0]);

    expect(ip).toBe("203.0.113.5");
  });

  it("skips remote lookups for private addresses", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(createFetchResponse({}));

    const country = await lookupCountry("127.0.0.1");

    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(country.code).toBe("US");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caches lookups to avoid redundant fetches", async () => {
    const expected = supportedCountries[0]!;
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      createFetchResponse({ country_code: expected.code }),
    );

    const first = await lookupCountry("8.8.8.8");
    const second = await lookupCountry("8.8.8.8");

    expect(first.code).toBe(expected.code);
    expect(second.code).toBe(expected.code);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("times out slow geo providers", async () => {
    vi.useFakeTimers();

    vi.spyOn(global, "fetch").mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal;
      return new Promise((_, reject) => {
        signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      }) as Promise<Response>;
    });

    const lookupPromise = lookupCountry("8.8.4.4");

    await vi.advanceTimersByTimeAsync(GEO_LOOKUP_TIMEOUT_MS + 10);

    await expect(lookupPromise).rejects.toThrow(/ipapi-timeout/);

    vi.useRealTimers();
  });
});
