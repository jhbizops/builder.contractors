import type { RequestHandler } from "express";

const CRAWL_SAFE_TAG = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const NO_INDEX_TAG = "noindex, nofollow, noarchive, nosnippet";

function shouldNoIndex(path: string): boolean {
  return (
    path.startsWith("/api") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path.startsWith("/login") ||
    path.startsWith("/register")
  );
}

export function buildContentSecurityPolicy(isProduction: boolean): string {
  const scriptSrc = ["'self'", ...(isProduction ? [] : ["https://replit.com"])].join(" ");
  const connectSrc = ["'self'", ...(isProduction ? [] : ["ws:", "wss:"])].join(" ");
  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ];

  return directives.join("; ");
}

function isHttpsRequest(req: { secure?: boolean; get(name: string): string | undefined }): boolean {
  if (req.secure) {
    return true;
  }

  const proto = req.get("x-forwarded-proto");
  if (!proto) {
    return false;
  }

  return proto
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .includes("https");
}

export function createSecurityHeadersMiddleware(isProduction: boolean): RequestHandler {
  const csp = buildContentSecurityPolicy(isProduction);

  return (req, res, next) => {
    res.setHeader("Content-Security-Policy", csp);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("X-Robots-Tag", shouldNoIndex(req.path) ? NO_INDEX_TAG : CRAWL_SAFE_TAG);

    if (isProduction && isHttpsRequest(req)) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();
  };
}
