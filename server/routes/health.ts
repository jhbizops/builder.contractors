import { Router } from "express";
import type { StartupCoordinator } from "../startup";

interface DatabaseClient {
  query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export interface HealthRouterOptions {
  startup: StartupCoordinator;
}

export function createHealthRouter(options: HealthRouterOptions) {
  const { startup } = options;
  const router = Router();

  router.get("/", (_req, res) => {
    res.status(200).json({
      status: "live",
      timestamp: new Date().toISOString(),
    });
  });

  router.get("/ready", (_req, res) => {
    const snapshot = startup.snapshot();
    res.status(snapshot.status === "ready" ? 200 : 503).json(snapshot);
  });

  return router;
}

export interface HealthProbeResult {
  status: "ok" | "error";
  latencyMs?: number;
  message?: string;
}

export const DEFAULT_DB_TIMEOUT_MS = 750;

export async function probeDatabase(
  db: DatabaseClient,
  timeoutMs: number = DEFAULT_DB_TIMEOUT_MS,
): Promise<HealthProbeResult> {
  const startedAt = Date.now();

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("health-db-timeout")), timeoutMs);
  });

  try {
    await Promise.race([db.query("select 1"), timeout]);
    return { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown-error";
    return { status: "error", message };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
