import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { clearGeoCache, geoDetectionMiddleware } from '../geoDetection';
import { formatCountryPayload } from '../../countries/service';
import { countryMetadataByCode } from '@shared/countryMetadata';

const createMockRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    headers: {},
    ip: '8.8.8.8',
    session: {} as any,
    ...overrides,
  }) as Request;

const createMockResponse = () => {
  const res: Partial<Response> = {
    statusCode: 200,
    headersSent: false,
    locals: {},
    redirect: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    req: { headers: { accept: 'text/html' } } as any,
  };
  return res as Response;
};

describe('geoDetectionMiddleware', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearGeoCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('populates session with supported country metadata', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ country_code: 'US' }),
    } as any);

    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    await geoDetectionMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.session.countryCode).toBe('US');
    expect(res.locals.country).toEqual(formatCountryPayload(countryMetadataByCode.US));
  });

  it('redirects when country is unsupported', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ country_code: 'CU' }),
    } as any);

    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    await geoDetectionMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(302, '/blocked?reason=region');
    expect(next).not.toHaveBeenCalled();
  });

  it('defaults to US when the lookup fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));

    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    await geoDetectionMiddleware(req, res, next);

    expect(req.session.countryCode).toBe('US');
    expect(next).toHaveBeenCalled();
  });
});
