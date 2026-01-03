import type { Request, RequestHandler, Response } from "express";

type RateLimitRecord = {
  count: number;
  first: number;
};

type ConsumeResult = {
  allowed: boolean;
  retryAfterMs: number;
};

class SlidingWindowRateLimiter {
  private readonly windowMs: number;
  private readonly max: number;
  private readonly hits = new Map<string, RateLimitRecord>();

  constructor(options: { windowMs: number; max: number }) {
    this.windowMs = options.windowMs;
    this.max = options.max;
  }

  consume(key: string, now: number): ConsumeResult {
    const existing = this.hits.get(key);

    if (!existing || now - existing.first >= this.windowMs) {
      this.hits.set(key, { count: 1, first: now });
      return { allowed: true, retryAfterMs: this.windowMs };
    }

    const updated: RateLimitRecord = {
      first: existing.first,
      count: existing.count + 1,
    };
    this.hits.set(key, updated);

    const allowed = updated.count <= this.max;
    const retryAfterMs = this.windowMs - (now - updated.first);

    return { allowed, retryAfterMs };
  }

  isLimited(key: string, now: number): ConsumeResult {
    const existing = this.hits.get(key);

    if (!existing) {
      return { allowed: true, retryAfterMs: this.windowMs };
    }

    if (now - existing.first >= this.windowMs) {
      this.hits.delete(key);
      return { allowed: true, retryAfterMs: this.windowMs };
    }

    const retryAfterMs = this.windowMs - (now - existing.first);
    return { allowed: existing.count < this.max, retryAfterMs };
  }

  increment(key: string, now: number): void {
    const existing = this.hits.get(key);

    if (!existing || now - existing.first >= this.windowMs) {
      this.hits.set(key, { count: 1, first: now });
      return;
    }

    this.hits.set(key, { ...existing, count: existing.count + 1 });
  }

  reset(key: string): void {
    this.hits.delete(key);
  }

  resetAll(): void {
    this.hits.clear();
  }
}

const GENERIC_MESSAGE = "Too many attempts. Please try again later.";
const RETRY_AFTER_HEADER = "Retry-After";

const loginAttemptLimiter = new SlidingWindowRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
});

const loginFailureLimiter = new SlidingWindowRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

const registerLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 12,
});

const buildIdentifiers = (req: Request): string[] => {
  const identifiers = new Set<string>();
  const ip = req.ip || req.socket.remoteAddress;
  if (ip) {
    identifiers.add(`ip:${ip}`);
  }
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : undefined;
  if (email) {
    identifiers.add(`email:${email}`);
  }
  return Array.from(identifiers);
};

const respondWithLimit = (res: Response, retryAfterMs: number): void => {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  res.setHeader(RETRY_AFTER_HEADER, retryAfterSeconds.toString());
  res.status(429).json({ message: GENERIC_MESSAGE });
};

const enforceLimit = (
  limiter: SlidingWindowRateLimiter,
  identifiers: string[],
  now: number,
  res: Response,
): boolean => {
  let retryAfterMs = 0;
  for (const id of identifiers) {
    const result = limiter.consume(id, now);
    if (!result.allowed) {
      retryAfterMs = Math.max(retryAfterMs, result.retryAfterMs);
    }
  }

  if (retryAfterMs > 0) {
    respondWithLimit(res, retryAfterMs);
    return true;
  }

  return false;
};

export const authLoginRateLimit: RequestHandler = (req, res, next) => {
  const identifiers = buildIdentifiers(req);
  const now = Date.now();

  if (enforceLimit(loginAttemptLimiter, identifiers, now, res)) {
    return;
  }

  let retryAfterMs = 0;
  for (const id of identifiers) {
    const result = loginFailureLimiter.isLimited(id, now);
    if (!result.allowed) {
      retryAfterMs = Math.max(retryAfterMs, result.retryAfterMs);
    }
  }

  if (retryAfterMs > 0) {
    respondWithLimit(res, retryAfterMs);
    return;
  }

  res.once("finish", () => {
    const status = res.statusCode;
    const timestamp = Date.now();

    if (status === 200) {
      for (const id of identifiers) {
        loginFailureLimiter.reset(id);
      }
      return;
    }

    if (status === 401) {
      for (const id of identifiers) {
        loginFailureLimiter.increment(id, timestamp);
      }
    }
  });

  next();
};

export const authRegisterRateLimit: RequestHandler = (req, res, next) => {
  const identifiers = buildIdentifiers(req);
  const now = Date.now();

  if (enforceLimit(registerLimiter, identifiers, now, res)) {
    return;
  }

  next();
};

export const __resetAuthRateLimiters = (): void => {
  loginAttemptLimiter.resetAll();
  loginFailureLimiter.resetAll();
  registerLimiter.resetAll();
};
