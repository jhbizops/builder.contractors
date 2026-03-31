import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { insertServiceSchema, type InsertService } from "@shared/schema";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storageInstance";

const servicesRouter = Router();

const updateServiceSchema = insertServiceSchema.partial();

servicesRouter.use(requireAuth);
const isAdmin = (role: string | undefined) => role === "admin" || role === "super_admin";
const tenantScope = (user: { id: string; role: string }) =>
  (isAdmin(user.role) ? { adminGlobal: true as const } : { tenantId: user.id });

servicesRouter.get("/", async (_req, res, next) => {
  try {
    const user = res.locals.authenticatedUser as { id: string; role: string };
    const services = await storage.listServices(tenantScope(user));
    res.json({ services });
  } catch (error) {
    next(error);
  }
});

servicesRouter.post("/", async (req, res, next) => {
  try {
    const payload = insertServiceSchema.parse(req.body);
    const user = res.locals.authenticatedUser as { id: string; role: string };
    const servicePayload: InsertService = {
      id: `service_${randomUUID()}`,
      tenantId: user.id,
      name: payload.name,
      description: payload.description ?? null,
      unit: payload.unit,
      basePrice: payload.basePrice,
      imageUrl: payload.imageUrl ?? null,
      active: payload.active ?? true,
    };
    const service = await storage.createService(servicePayload);
    res.status(201).json({ service });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

servicesRouter.patch("/:id", async (req, res, next) => {
  try {
    const payload = updateServiceSchema.parse(req.body);
    const user = res.locals.authenticatedUser as { id: string; role: string };
    const service = await storage.updateService(req.params.id, payload, tenantScope(user));
    if (!service) {
      res.status(404).json({ message: "Service not found" });
      return;
    }
    res.json({ service });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

export { servicesRouter };
