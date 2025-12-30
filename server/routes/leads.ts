import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { insertLeadSchema, insertLeadCommentSchema, insertActivityLogSchema } from "@shared/schema";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storageInstance";

const leadsRouter = Router();

const statusEnum = z.enum(["new", "in_progress", "completed", "on_hold"]);

const updateLeadSchema = insertLeadSchema
  .omit({ partnerId: true, createdBy: true })
  .extend({
    status: statusEnum.optional(),
    notes: z.array(z.string()).optional(),
    files: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          mimeType: z.string(),
          size: z.number(),
          dataUrl: z.string(),
          uploadedAt: z.union([z.string(), z.date()]).transform((value) => new Date(value)),
        }),
      )
      .optional(),
    updatedBy: z.string().optional(),
  })
  .partial();

const filterSchema = z.object({
  status: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
});

const commentSchema = insertLeadCommentSchema.pick({
  body: true,
});

const activitySchema = insertActivityLogSchema.pick({
  action: true,
  details: true,
});

function parseListFilters(query: unknown) {
  const raw = filterSchema.parse(query);

  const parseList = (value?: string) =>
    value?.split(",").map((v) => v.trim()).filter(Boolean) ?? undefined;

  return {
    status: parseList(raw.status),
    region: parseList(raw.region),
    country: parseList(raw.country),
  };
}

function isAdmin(role: string | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

leadsRouter.use(requireAuth);

leadsRouter.get("/", async (req, res, next) => {
  try {
    const filters = parseListFilters(req.query);
    const user = res.locals.authenticatedUser;
    const leads = await storage.listLeads({
      ...filters,
      partnerId: isAdmin(user.role) ? undefined : user.id,
    });
    res.json({ leads });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

leadsRouter.post("/", async (req, res, next) => {
  try {
    const user = res.locals.authenticatedUser;
    const payload = insertLeadSchema
      .extend({ status: statusEnum.default("new") })
      .omit({ id: true, createdAt: true, updatedAt: true })
      .parse(req.body);

    const lead = await storage.createLead({
      ...payload,
      id: `lead_${randomUUID()}`,
      partnerId: payload.partnerId ?? user.id,
      createdBy: payload.createdBy ?? user.email,
      updatedBy: user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await storage.addActivityLog({
      id: `log_${randomUUID()}`,
      leadId: lead.id,
      jobId: null,
      action: "lead_created",
      performedBy: user.email,
      details: { clientName: lead.clientName },
    });

    res.status(201).json({ lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

leadsRouter.patch("/:id", async (req, res, next) => {
  try {
    const payload = updateLeadSchema.parse(req.body);
    const user = res.locals.authenticatedUser;
    const lead = await storage.updateLead(req.params.id, { ...payload, updatedBy: user.email });

    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    res.json({ lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

leadsRouter.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await storage.deleteLead(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

leadsRouter.get("/:id/comments", async (req, res, next) => {
  try {
    const comments = await storage.listLeadComments(req.params.id);
    res.json({ comments });
  } catch (error) {
    next(error);
  }
});

leadsRouter.post("/:id/comments", async (req, res, next) => {
  try {
    const user = res.locals.authenticatedUser;
    const payload = commentSchema.parse(req.body);
    const comment = await storage.addLeadComment({
      ...payload,
      id: `comment_${randomUUID()}`,
      leadId: req.params.id,
      author: user.email,
      timestamp: new Date(),
    });
    res.status(201).json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

leadsRouter.get("/:id/activity", async (req, res, next) => {
  try {
    const activity = await storage.listLeadActivity(req.params.id);
    res.json({ activity });
  } catch (error) {
    next(error);
  }
});

leadsRouter.post("/:id/activity", async (req, res, next) => {
  try {
    const user = res.locals.authenticatedUser;
    const payload = activitySchema.parse(req.body);
    const log = await storage.addActivityLog({
      ...payload,
      id: `log_${randomUUID()}`,
      leadId: req.params.id,
      jobId: null,
      performedBy: user.email,
      timestamp: new Date(),
    });
    res.status(201).json({ log });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

export { leadsRouter };
