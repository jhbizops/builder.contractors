import { Router } from "express";
import { constants as fsConstants, promises as fs } from "node:fs";
import { ensureReportsDir } from "../reports/storage";
import type { StartupCoordinator } from "../startup";

interface DatabaseClient {
  query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

interface BillingClient {
  listPlans(): Promise<unknown[]>;
}

export interface HealthRouterOptions {
  startup: StartupCoordinator;
  checks?: {
    database?: () => Promise<HealthProbeResult>;
    sessionStore?: () => Promise<HealthProbeResult>;
    billing?: () => Promise<HealthProbeResult>;
    exportStorage?: () => Promise<HealthProbeResult>;
  };
}

export interface HealthProbeResult {
  status: "ok" | "error";
  latencyMs?: number;
  message?: string;
}

export interface RuntimeReadinessReport {
  enabled: boolean;
  status: "healthy" | "degraded";
  checkedAt: string;
  components: {
    database: HealthProbeResult;
    sessionStore: HealthProbeResult;
    billing: HealthProbeResult;
    exportStorage: HealthProbeResult;
  };
}

export const DEFAULT_DB_TIMEOUT_MS = 750;
export const DEFAULT_RUNTIME_CHECK_TIMEOUT_MS = 900;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown-error";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function timedProbe(
  name: string,
  check: () => Promise<void>,
  timeoutMs: number,
): Promise<HealthProbeResult> {
  const startedAt = Date.now();

  try {
    await withTimeout(check(), timeoutMs, `health-${name}-timeout`);
    return { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      status: "error",
      latencyMs: Date.now() - startedAt,
      message: getErrorMessage(error),
    };
  }
}

export async function probeDatabase(
  db: DatabaseClient,
  timeoutMs: number = DEFAULT_DB_TIMEOUT_MS,
): Promise<HealthProbeResult> {
  return timedProbe("db", async () => {
    await db.query("select 1");
  }, timeoutMs);
}

export async function probeSessionStore(
  db: DatabaseClient,
  timeoutMs: number = DEFAULT_RUNTIME_CHECK_TIMEOUT_MS,
): Promise<HealthProbeResult> {
  return timedProbe("session-store", async () => {
    await db.query("select 1 from user_sessions limit 1");
  }, timeoutMs);
}

export async function probeBilling(
  billing: BillingClient,
  timeoutMs: number = DEFAULT_RUNTIME_CHECK_TIMEOUT_MS,
): Promise<HealthProbeResult> {
  return timedProbe("billing", async () => {
    await billing.listPlans();
  }, timeoutMs);
}

export async function probeExportStorage(
  timeoutMs: number = DEFAULT_RUNTIME_CHECK_TIMEOUT_MS,
): Promise<HealthProbeResult> {
  return timedProbe("export-storage", async () => {
    const dir = await ensureReportsDir();
    await fs.access(dir, fsConstants.R_OK | fsConstants.W_OK);
  }, timeoutMs);
}

function shouldRunRuntimeChecks(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "runtime";
}

export function createHealthRouter(options: HealthRouterOptions) {
  const { startup, checks } = options;
  const router = Router();

  router.get("/", (_req, res) => {
    res.status(200).json({
      status: "live",
      timestamp: new Date().toISOString(),
    });
  });

  router.get("/ready", async (req, res) => {
    const snapshot = startup.snapshot();
    const baseStatusCode = snapshot.status === "ready" ? 200 : 503;

    const runRuntimeChecks = shouldRunRuntimeChecks(req.query.runtimeChecks);
    if (!runRuntimeChecks || !checks) {
      res.status(baseStatusCode).json({
        ...snapshot,
        runtime: { enabled: false },
      });
      return;
    }

    const [database, sessionStore, billing, exportStorage] = await Promise.all([
      checks.database ? checks.database() : Promise.resolve({ status: "ok" as const }),
      checks.sessionStore ? checks.sessionStore() : Promise.resolve({ status: "ok" as const }),
      checks.billing ? checks.billing() : Promise.resolve({ status: "ok" as const }),
      checks.exportStorage ? checks.exportStorage() : Promise.resolve({ status: "ok" as const }),
    ]);

    const runtimeStatus: RuntimeReadinessReport["status"] =
      [database, sessionStore, billing, exportStorage].every((component) => component.status === "ok")
        ? "healthy"
        : "degraded";

    const runtime: RuntimeReadinessReport = {
      enabled: true,
      status: runtimeStatus,
      checkedAt: new Date().toISOString(),
      components: {
        database,
        sessionStore,
        billing,
        exportStorage,
      },
    };

    const statusCode = snapshot.status === "ready" && runtime.status === "healthy" ? 200 : 503;
    res.status(statusCode).json({
      ...snapshot,
      runtime,
    });
  });

  return router;
}
