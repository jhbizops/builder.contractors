export type DependencyStatus = "pending" | "ok" | "error";

export interface DependencySnapshot {
  name: string;
  critical: boolean;
  status: DependencyStatus;
  attempts: number;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
}

interface DependencyState extends DependencySnapshot {}

interface RetryOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_BASE_DELAY_MS = 1_000;
const DEFAULT_MAX_DELAY_MS = 60_000;

function structuredLog(event: string, payload: Record<string, unknown>) {
  console.error(JSON.stringify({ event, ...payload, timestamp: new Date().toISOString() }));
}

export class StartupCoordinator {
  private readonly dependencies = new Map<string, DependencyState>();
  private readonly jobsStarted = new Set<string>();

  registerDependency(name: string, critical: boolean): void {
    if (this.dependencies.has(name)) {
      return;
    }

    this.dependencies.set(name, {
      name,
      critical,
      status: "pending",
      attempts: 0,
      lastSuccessAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
    });
  }

  snapshot() {
    const dependencies = Array.from(this.dependencies.values(), (entry) => ({ ...entry }));
    const ready = dependencies
      .filter((entry) => entry.critical)
      .every((entry) => entry.status === "ok");

    return {
      status: ready ? "ready" : "not_ready",
      dependencies,
      checkedAt: new Date().toISOString(),
    } as const;
  }

  startRetriableJob(
    name: string,
    options: { critical: boolean; job: () => Promise<void> } & RetryOptions,
  ): void {
    if (this.jobsStarted.has(name)) {
      return;
    }

    this.jobsStarted.add(name);
    this.registerDependency(name, options.critical);

    const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;

    const runAttempt = async (attempt: number): Promise<void> => {
      const dependency = this.dependencies.get(name);
      if (!dependency) {
        return;
      }

      dependency.attempts += 1;

      try {
        await options.job();
        dependency.status = "ok";
        dependency.lastSuccessAt = new Date().toISOString();
        dependency.lastErrorAt = null;
        dependency.lastErrorMessage = null;
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown-startup-error";
        dependency.status = "error";
        dependency.lastErrorAt = new Date().toISOString();
        dependency.lastErrorMessage = message;

        structuredLog("startup.background_job_failed", {
          job: name,
          attempt,
          critical: dependency.critical,
          retryInMs: Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1)),
          error: message,
        });

        const delayMs = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
        setTimeout(() => {
          runAttempt(attempt + 1).catch((timeoutError) => {
            structuredLog("startup.scheduler_failed", {
              job: name,
              error:
                timeoutError instanceof Error
                  ? timeoutError.message
                  : "unknown-scheduler-error",
            });
          });
        }, delayMs);
      }
    };

    runAttempt(1).catch((error) => {
      structuredLog("startup.job_failed_to_start", {
        job: name,
        error: error instanceof Error ? error.message : "unknown-start-error",
      });
    });
  }
}

export function createStartupCoordinator() {
  return new StartupCoordinator();
}
