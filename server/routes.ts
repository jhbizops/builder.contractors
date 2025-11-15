import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { findCountryByCode, formatCountryPayload, supportedCountries } from "./countries/service";
import { calculateAdminMetrics } from "./admin/metrics";
import {
  buildLeadsCsv,
  buildLeadsSpreadsheet,
  buildServicesCsv,
  buildServicesSpreadsheet,
} from "./admin/export";
import { storage } from "./storage";

type AsyncHandler = (
  ...args: Parameters<RequestHandler>
) => Promise<unknown>;

const asyncHandler = (handler: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/countries", (_req, res) => {
    res.json(supportedCountries.map(formatCountryPayload));
  });

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

  app.get(
    "/api/admin/metrics",
    asyncHandler(async (_req, res) => {
      const metrics = await calculateAdminMetrics(storage);
      res.json(metrics);
    }),
  );

  app.get(
    "/api/admin/export/leads.csv",
    asyncHandler(async (_req, res) => {
      const leads = await storage.listLeads();
      const csv = buildLeadsCsv(leads);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=\"leads.csv\"");
      res.setHeader("Cache-Control", "no-store");
      res.send(csv);
    }),
  );

  app.get(
    "/api/admin/export/leads.xlsx",
    asyncHandler(async (_req, res) => {
      const leads = await storage.listLeads();
      const xml = buildLeadsSpreadsheet(leads);

      res.setHeader("Content-Type", "application/vnd.ms-excel");
      res.setHeader("Content-Disposition", "attachment; filename=\"leads.xlsx\"");
      res.setHeader("Cache-Control", "no-store");
      res.send(xml);
    }),
  );

  app.get(
    "/api/admin/export/services.csv",
    asyncHandler(async (_req, res) => {
      const services = await storage.listServices();
      const csv = buildServicesCsv(services);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=\"services.csv\"");
      res.setHeader("Cache-Control", "no-store");
      res.send(csv);
    }),
  );

  app.get(
    "/api/admin/export/services.xlsx",
    asyncHandler(async (_req, res) => {
      const services = await storage.listServices();
      const xml = buildServicesSpreadsheet(services);

      res.setHeader("Content-Type", "application/vnd.ms-excel");
      res.setHeader("Content-Disposition", "attachment; filename=\"services.xlsx\"");
      res.setHeader("Cache-Control", "no-store");
      res.send(xml);
    }),
  );

  app.delete(
    "/api/leads/:id",
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      await storage.deleteLead(id);
      res.status(204).send();
    }),
  );

  app.get("/blocked", (_req, res) => {
    res.status(403).send("Service not available in your region");
  });

  app.get("/healthz", (_req, res) => {
    res.json({ status: "live", countries: supportedCountries.length });
  });

  const httpServer = createServer(app);

  return httpServer;
}
