export function isBillingWebhookRequest(originalUrl: string): boolean {
  return originalUrl === "/api/billing/webhook" || originalUrl.startsWith("/api/billing/webhook?");
}

export function shouldSkipBodyParsers(originalUrl: string): boolean {
  return isBillingWebhookRequest(originalUrl);
}

export function buildApiLogLine(params: {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}): string {
  const base = `${params.method} ${params.path} ${params.statusCode} in ${params.durationMs}ms`;
  if (base.length <= 80) {
    return base;
  }

  return `${base.slice(0, 79)}…`;
}
