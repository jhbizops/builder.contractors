import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { insertServiceSchema } from "@shared/schema";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storageInstance";

const servicesRouter = Router();

const updateServiceSchema = insertServiceSchema
  .omit({ id: true })
  .partial();

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
    const service = await storage.createService({
      ...payload,
      id: `service_${randomUUID()}`,
    });
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
