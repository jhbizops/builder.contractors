type ProcessEnv = Record<string, string | undefined>;
import type { Request } from "express";
import { timingSafeEqual } from "node:crypto";

export interface AdminBootstrapSecurityConfig {
  enabled: boolean;
  token: string | null;
  allowedIps: string[];
  isProduction: boolean;
}

let tokenConsumed = false;

export function resetAdminBootstrapStateForTests(): void {
  tokenConsumed = false;
}

function parseBooleanFlag(value: string | undefined): boolean {
  return value === "true";
}

function parseAllowedIps(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);
}

export function getAdminBootstrapSecurityConfig(env: ProcessEnv = process.env): AdminBootstrapSecurityConfig {
  const enabled = parseBooleanFlag(env.ALLOW_ADMIN_BOOTSTRAP);
  const token = env.ADMIN_BOOTSTRAP_TOKEN?.trim() || null;

  return {
    enabled,
    token,
    allowedIps: parseAllowedIps(env.ADMIN_BOOTSTRAP_ALLOWED_IPS),
    isProduction: env.NODE_ENV === "production",
  };
}

export function assertAdminBootstrapStartupConfig(env: ProcessEnv = process.env): void {
  const config = getAdminBootstrapSecurityConfig(env);

  if (!config.enabled || !config.isProduction) {
    return;
  }

  if (!config.token) {
    throw new Error("ALLOW_ADMIN_BOOTSTRAP=true in production requires ADMIN_BOOTSTRAP_TOKEN");
  }

  if (config.allowedIps.length === 0) {
    throw new Error("ALLOW_ADMIN_BOOTSTRAP=true in production requires ADMIN_BOOTSTRAP_ALLOWED_IPS");
  }
}

export function isBootstrapIpAllowed(requestIp: string, allowedIps: string[]): boolean {
  if (allowedIps.length === 0) {
    return false;
  }

  return allowedIps.includes(requestIp);
}

export function verifyBootstrapToken(providedToken: string, expectedToken: string): boolean {
  const providedBuffer = Buffer.from(providedToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function canConsumeBootstrapToken(): boolean {
  return !tokenConsumed;
}

export function consumeBootstrapToken(): void {
  tokenConsumed = true;
}

export function getClientIp(req: Request): string {
  if (req.ip) {
    return req.ip;
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return req.socket.remoteAddress ?? "unknown";
}
