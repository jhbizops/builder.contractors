import type { Express } from "express";
import { createServer, type Server } from "http";
import { findCountryByCode, formatCountryPayload, supportedCountries } from "./countries/service";
import { authRouter } from "./auth/routes";
import { usersRouter } from "./users/routes";
import { billingRouter } from "./billing/routes";
import { getBillingService, initializeStripe } from "./billing/instance";
import { ensureDatabase } from "./dbBootstrap";
import { pool } from "./db";
import {
  createHealthRouter,
  probeBilling,
  probeDatabase,
  probeExportStorage,
  probeSessionStore,
} from "./routes/health";
import { jobsRouter } from "./routes/jobs";
import { leadsRouter } from "./routes/leads";
import { reportsRouter } from "./routes/reports";
import { servicesRouter } from "./routes/services";
import { adminRouter } from "./routes/admin";
import { createSeoRouter } from "./routes/seo";
import { adsRouter } from "./routes/ads";
import { createStartupCoordinator } from "./startup";

export interface AppRuntime {
  httpServer: Server;
}

export async function registerRoutes(app: Express): Promise<AppRuntime> {
  const startup = createStartupCoordinator();

  startup.startRetriableJob("database", {
    critical: true,
    job: async () => {
      await ensureDatabase(pool);
      const probe = await probeDatabase(pool);
      if (probe.status !== "ok") {
        throw new Error(probe.message ?? "database-probe-failed");
      }
    },
  });

  startup.startRetriableJob("stripe", {
    critical: false,
    job: async () => {
      await initializeStripe();
    },
  });

  startup.startRetriableJob("billing_plan_sync", {
    critical: false,
    baseDelayMs: 3_000,
    maxDelayMs: 300_000,
    job: async () => {
      const billingService = getBillingService();
      await billingService.ensurePlans();
    },
  });

  app.use(createSeoRouter());

  app.get("/api/countries", (_req, res) => {
    res.json(supportedCountries.map(formatCountryPayload));
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/billing", billingRouter);
  app.use("/api/jobs", jobsRouter);
  app.use("/api/leads", leadsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/ads", adsRouter);
  app.use("/api/admin", adminRouter);

  app.get("/api/session/geo", (req, res) => {
    if (!req.session.countryCode) {
      res.json({
        country: null,
        localize: false,
      });
      return;
    }

    const { country } = findCountryByCode(req.session.countryCode);

    res.json({
      localize: req.session.localize ?? false,
      country:
        country
          ? formatCountryPayload(country)
          : {
              name: req.session.countryName,
              code: req.session.countryCode,
              currency: req.session.currency,
              languages: req.session.languages ?? [],
              localize: req.session.localize ?? false,
              proficiency: "unknown",
            },
    });
  });

  app.get("/blocked", (_req, res) => {
    res.status(403).send("Service not available in your region");
  });

  app.use("/healthz", createHealthRouter({
    startup,
    checks: {
      database: () => probeDatabase(pool),
      sessionStore: () => probeSessionStore(pool),
      billing: () => probeBilling(getBillingService()),
      exportStorage: () => probeExportStorage(),
    },
  }));

  const httpServer = createServer(app);

  return { httpServer };
}
