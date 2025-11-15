import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { db, leads, eq } from "../../db";
import {
  insertLeadSchema,
  type Lead,
  type StoredLeadFile,
} from "@shared/schema";
import { asyncHandler } from "./utils";

const router = Router();

const leadCreateSchema = insertLeadSchema.extend({
  notes: z.array(z.string()).default([]),
  files: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      mimeType: z.string(),
      size: z.number(),
      dataUrl: z.string(),
      uploadedAt: z.string(),
    }),
  ).default([]),
});

const leadUpdateSchema = leadCreateSchema.partial();

type LeadApiResponse = Omit<Lead, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
  files: StoredLeadFile[];
};

function serializeLead(lead: Lead): LeadApiResponse {
  return {
    ...lead,
    notes: lead.notes ?? [],
    files: (lead.files ?? []) as StoredLeadFile[],
    createdAt: lead.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: lead.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

router.get(
  "/leads",
  asyncHandler(async (_req, res) => {
    const result = await db.query.leads.findMany({ orderBy: (table, { desc }) => [desc(table.createdAt)] });
    res.json(result.map(serializeLead));
  }),
);

router.post(
  "/leads",
  asyncHandler(async (req, res) => {
    const parsed = leadCreateSchema.parse(req.body);
    const now = new Date();
    const [lead] = await db
      .insert(leads)
      .values({
        id: randomUUID(),
        ...parsed,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    res.status(201).json(serializeLead(lead));
  }),
);

router.patch(
  "/leads/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = leadUpdateSchema.parse(req.body);
    const [lead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();

    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    res.json(serializeLead(lead));
  }),
);

router.delete(
  "/leads/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [lead] = await db.delete(leads).where(eq(leads.id, id)).returning();

    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    res.status(204).end();
  }),
);

export const leadsRouter = router;
