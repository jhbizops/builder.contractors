import type { Express } from "express";
import { createServer, type Server } from "http";
import { Router } from "express";
import { findCountryByCode, formatCountryPayload, supportedCountries } from "./countries/service";
import { createApiRouter } from "./routes/api";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = Router();
  apiRouter.get("/countries", (_req, res) => {
    res.json(supportedCountries.map(formatCountryPayload));
  });

  apiRouter.use(createApiRouter());

  app.use("/api", apiRouter);

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

  app.get("/healthz", (_req, res) => {
    res.json({ status: "live", countries: supportedCountries.length });
  });

  const httpServer = createServer(app);

  return httpServer;
}
