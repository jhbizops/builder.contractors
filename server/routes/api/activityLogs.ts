import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { db, activityLogs, eq } from "../../db";
import {
  insertActivityLogSchema,
  type ActivityLog,
} from "@shared/schema";
import { asyncHandler } from "./utils";

const router = Router();

type ActivityLogInsert = typeof activityLogs.$inferInsert;

const activityLogCreateSchema = insertActivityLogSchema.extend({
  timestamp: z.string().optional(),
});

const activityLogUpdateSchema = z.object({
  action: z.string().min(1).optional(),
  leadId: z.string().optional(),
  performedBy: z.string().optional(),
  timestamp: z.string().optional(),
});

type ActivityLogResponse = Omit<ActivityLog, "timestamp"> & { timestamp: string };

function serialize(log: ActivityLog): ActivityLogResponse {
  return {
    ...log,
    timestamp: log.timestamp?.toISOString() ?? new Date().toISOString(),
  };
}

router.get(
  "/activity-logs",
  asyncHandler(async (req, res) => {
    const leadId = typeof req.query.leadId === "string" ? req.query.leadId : undefined;
    const result = await db.query.activityLogs.findMany({
      where: leadId ? (table, { eq }) => eq(table.leadId, leadId) : undefined,
      orderBy: (table, { desc }) => [desc(table.timestamp)],
    });

    res.json(result.map(serialize));
  }),
);

router.post(
  "/activity-logs",
  asyncHandler(async (req, res) => {
    const parsed = activityLogCreateSchema.parse(req.body);
    const timestamp = parsed.timestamp ? new Date(parsed.timestamp) : new Date();
    const [log] = await db
      .insert(activityLogs)
      .values({
        id: randomUUID(),
        ...parsed,
        timestamp,
      })
      .returning();

    res.status(201).json(serialize(log));
  }),
);

router.patch(
  "/activity-logs/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = activityLogUpdateSchema.parse(req.body);
    const updateValues: Partial<ActivityLogInsert> = {};

    if (updates.action !== undefined) {
      updateValues.action = updates.action;
    }

    if (updates.leadId !== undefined) {
      updateValues.leadId = updates.leadId;
    }

    if (updates.performedBy !== undefined) {
      updateValues.performedBy = updates.performedBy;
    }

    if (updates.timestamp !== undefined) {
      updateValues.timestamp = new Date(updates.timestamp);
    }

    const [log] = await db
      .update(activityLogs)
      .set(updateValues)
      .where(eq(activityLogs.id, id))
      .returning();

    if (!log) {
      res.status(404).json({ message: "Activity log not found" });
      return;
    }

    res.json(serialize(log));
  }),
);

router.delete(
  "/activity-logs/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [log] = await db.delete(activityLogs).where(eq(activityLogs.id, id)).returning();

    if (!log) {
      res.status(404).json({ message: "Activity log not found" });
      return;
    }

    res.status(204).end();
  }),
);

export const activityLogsRouter = router;
