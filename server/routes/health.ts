import { Router } from "express";

interface DatabaseClient {
  query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export interface HealthRouterOptions {
  db: DatabaseClient;
  countriesCount: number;
  dbTimeoutMs?: number;
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

export function createHealthRouter(options: HealthRouterOptions) {
  const { db, countriesCount, dbTimeoutMs = DEFAULT_DB_TIMEOUT_MS } = options;
  const router = Router();

  router.get("/", async (_req, res) => {
    const dbResult = await probeDatabase(db, dbTimeoutMs);
    const healthy = dbResult.status === "ok";

    const payload = {
      status: healthy ? "live" : "degraded",
      db: dbResult,
      countries: countriesCount,
      timestamp: new Date().toISOString(),
    };

    res.status(healthy ? 200 : 503).json(payload);
  });

  return router;
}
