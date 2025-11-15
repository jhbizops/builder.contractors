import { randomUUID } from "node:crypto";
import { Router } from "express";
import { db, services, eq } from "../../db";
import { insertServiceSchema, type Service } from "@shared/schema";
import { asyncHandler } from "./utils";

const router = Router();

const serviceCreateSchema = insertServiceSchema;
const serviceUpdateSchema = insertServiceSchema.partial();

type ServiceResponse = Service;

function serialize(service: Service): ServiceResponse {
  return {
    ...service,
    active: service.active ?? true,
  };
}

router.get(
  "/services",
  asyncHandler(async (_req, res) => {
    const result = await db.query.services.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    });

    res.json(result.map(serialize));
  }),
);

router.post(
  "/services",
  asyncHandler(async (req, res) => {
    const parsed = serviceCreateSchema.parse(req.body);
    const [service] = await db
      .insert(services)
      .values({
        id: randomUUID(),
        ...parsed,
      })
      .returning();

    res.status(201).json(serialize(service));
  }),
);

router.patch(
  "/services/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = serviceUpdateSchema.parse(req.body);
    const [service] = await db
      .update(services)
      .set(updates)
      .where(eq(services.id, id))
      .returning();

    if (!service) {
      res.status(404).json({ message: "Service not found" });
      return;
    }

    res.json(serialize(service));
  }),
);

router.delete(
  "/services/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [service] = await db.delete(services).where(eq(services.id, id)).returning();

    if (!service) {
      res.status(404).json({ message: "Service not found" });
      return;
    }

    res.status(204).end();
  }),
);

export const servicesRouter = router;
