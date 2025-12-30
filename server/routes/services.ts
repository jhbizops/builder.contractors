import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { insertServiceSchema, type InsertService } from "@shared/schema";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storageInstance";

const servicesRouter = Router();

const updateServiceSchema = insertServiceSchema.partial();

servicesRouter.use(requireAuth);

servicesRouter.get("/", async (_req, res, next) => {
  try {
    const services = await storage.listServices();
    res.json({ services });
  } catch (error) {
    next(error);
  }
});

servicesRouter.post("/", async (req, res, next) => {
  try {
    const payload = insertServiceSchema.parse(req.body);
    const servicePayload: InsertService = {
      id: `service_${randomUUID()}`,
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
    const service = await storage.updateService(req.params.id, payload);
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
