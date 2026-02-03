import type { Express } from "express";
import { createServer, type Server } from "http";
import { findCountryByCode, formatCountryPayload, supportedCountries } from "./countries/service";
import { authRouter } from "./auth/routes";
import { usersRouter } from "./users/routes";
import { billingRouter } from "./billing/routes";
import { getBillingService, initializeStripe } from "./billing/instance";
import { ensureDatabase } from "./dbBootstrap";
import { pool } from "./db";
import { createHealthRouter } from "./routes/health";
import { jobsRouter } from "./routes/jobs";
import { leadsRouter } from "./routes/leads";
import { reportsRouter } from "./routes/reports";
import { servicesRouter } from "./routes/services";
import { adminRouter } from "./routes/admin";
import { createSeoRouter } from "./routes/seo";
import { adsRouter } from "./routes/ads";

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureDatabase(pool);
  await initializeStripe();
  const billingService = getBillingService();
  await billingService.ensurePlans();

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

  app.use(
    "/healthz",
    createHealthRouter({ db: pool, countriesCount: supportedCountries.length }),
  );

  const httpServer = createServer(app);

  return httpServer;
}
