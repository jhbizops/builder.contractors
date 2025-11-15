import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "./utils";
import { db, leadComments, eq } from "../../db";
import { insertLeadCommentSchema, type LeadComment } from "@shared/schema";

const router = Router();

const leadCommentCreateSchema = insertLeadCommentSchema.extend({
  timestamp: z.string().optional(),
});

const leadCommentUpdateSchema = z.object({
  body: z.string().min(1),
});

type LeadCommentResponse = Omit<LeadComment, "timestamp"> & { timestamp: string };

function serialize(comment: LeadComment): LeadCommentResponse {
  return {
    ...comment,
    timestamp: comment.timestamp?.toISOString() ?? new Date().toISOString(),
  };
}

router.get(
  "/lead-comments",
  asyncHandler(async (req, res) => {
    const leadId = typeof req.query.leadId === "string" ? req.query.leadId : undefined;

    const result = await db.query.leadComments.findMany({
      where: leadId ? (table, { eq }) => eq(table.leadId, leadId) : undefined,
      orderBy: (table, { desc }) => [desc(table.timestamp)],
    });

    res.json(result.map(serialize));
  }),
);

router.post(
  "/lead-comments",
  asyncHandler(async (req, res) => {
    const parsed = leadCommentCreateSchema.parse(req.body);
    const timestamp = parsed.timestamp ? new Date(parsed.timestamp) : new Date();
    const [comment] = await db
      .insert(leadComments)
      .values({
        id: randomUUID(),
        ...parsed,
        timestamp,
      })
      .returning();

    res.status(201).json(serialize(comment));
  }),
);

router.patch(
  "/lead-comments/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = leadCommentUpdateSchema.parse(req.body);
    const [comment] = await db
      .update(leadComments)
      .set(updates)
      .where(eq(leadComments.id, id))
      .returning();

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    res.json(serialize(comment));
  }),
);

router.delete(
  "/lead-comments/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [comment] = await db.delete(leadComments).where(eq(leadComments.id, id)).returning();

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    res.status(204).end();
  }),
);

export const leadCommentsRouter = router;
