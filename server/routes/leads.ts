import { randomUUID } from "node:crypto";
import { Router, type Response } from "express";
import { z } from "zod";
import { insertLeadSchema, insertLeadCommentSchema, insertActivityLogSchema, type InsertLead } from "@shared/schema";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storageInstance";

const leadsRouter = Router();

const statusEnum = z.enum(["new", "in_progress", "completed", "on_hold"]);

const leadFileSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number(),
  dataUrl: z.string(),
  uploadedAt: z.union([z.string(), z.date()]).transform((value) => new Date(value)),
});

const createLeadSchema = z.object({
  partnerId: z.string().optional(),
  clientName: z.string().min(1),
  status: statusEnum.default("new"),
  location: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  notes: z.array(z.string()).default([]),
  files: z.array(leadFileSchema).default([]),
  createdBy: z.string().optional(),
});

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

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  approved: boolean;
};

function getUser(res: Response): AuthenticatedUser {
  const user = res.locals.authenticatedUser as AuthenticatedUser | undefined;
  if (!user) {
    throw new Error("Authenticated user missing");
  }
  return user;
}

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

function requireApproval(user: AuthenticatedUser): boolean {
  return user.approved || isAdmin(user.role);
}

function ensureApproved(user: AuthenticatedUser, res: Response, message: string): boolean {
  if (!requireApproval(user)) {
    res.status(403).json({ message });
    return false;
  }
  return true;
}

async function getAuthorizedLead(id: string, user: AuthenticatedUser, res: Response) {
  const lead = await storage.getLead(id, { partnerId: isAdmin(user.role) ? undefined : user.id });
  if (lead) return lead;

  const existing = await storage.getLead(id);
  if (existing) {
    res.status(403).json({ message: "Forbidden" });
    return null;
  }

  res.status(404).json({ message: "Lead not found" });
  return null;
}

leadsRouter.use(requireAuth);

leadsRouter.get("/", async (req, res, next) => {
  try {
    const filters = parseListFilters(req.query);
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to access leads")) return;
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
    const user = getUser(res);
    const parsed = createLeadSchema.parse(req.body);

    if (!ensureApproved(user, res, "Approval required to create leads")) return;

    const leadPayload: InsertLead = {
      id: `lead_${randomUUID()}`,
      partnerId: isAdmin(user.role) ? parsed.partnerId ?? user.id : user.id,
      clientName: parsed.clientName,
      status: parsed.status,
      location: parsed.location ?? null,
      country: parsed.country ?? null,
      region: parsed.region ?? null,
      notes: parsed.notes ?? [],
      files: (parsed.files ?? []).map((file) => ({
        ...file,
        id: file.id ?? `lead_file_${randomUUID()}`,
      })),
      createdBy: parsed.createdBy ?? user.email,
      updatedBy: user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const lead = await storage.createLead(leadPayload);

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
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to update leads")) return;
    const lead = await getAuthorizedLead(req.params.id, user, res);
    if (!lead) return;
    const updated = await storage.updateLead(
      lead.id,
      { ...payload, updatedBy: user.email },
      { partnerId: isAdmin(user.role) ? undefined : user.id },
    );

    if (!updated) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    res.json({ lead: updated });
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
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to delete leads")) return;
    const lead = await getAuthorizedLead(req.params.id, user, res);
    if (!lead) return;
    const deleted = await storage.deleteLead(lead.id, { partnerId: isAdmin(user.role) ? undefined : user.id });
    if (!deleted) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

leadsRouter.get("/:id", async (req, res, next) => {
  try {
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to access leads")) return;
    const lead = await getAuthorizedLead(req.params.id, user, res);
    if (!lead) return;
    res.json({ lead });
  } catch (error) {
    next(error);
  }
});

leadsRouter.get("/:id/comments", async (req, res, next) => {
  try {
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to access leads")) return;
    const lead = await getAuthorizedLead(req.params.id, user, res);
    if (!lead) return;
    const comments = await storage.listLeadComments(req.params.id, {
      partnerId: isAdmin(user.role) ? undefined : user.id,
    });
    res.json({ comments });
  } catch (error) {
    next(error);
  }
});

leadsRouter.post("/:id/comments", async (req, res, next) => {
  try {
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to comment on leads")) return;
    const lead = await getAuthorizedLead(req.params.id, user, res);
    if (!lead) return;
    const payload = commentSchema.parse(req.body);
    const comment = await storage.addLeadComment({
      ...payload,
      id: `comment_${randomUUID()}`,
      leadId: lead.id,
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
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to access leads")) return;
    const lead = await getAuthorizedLead(req.params.id, user, res);
    if (!lead) return;
    const activity = await storage.listLeadActivity(req.params.id, {
      partnerId: isAdmin(user.role) ? undefined : user.id,
    });
    res.json({ activity });
  } catch (error) {
    next(error);
  }
});

leadsRouter.post("/:id/activity", async (req, res, next) => {
  try {
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to update leads")) return;
    const lead = await getAuthorizedLead(req.params.id, user, res);
    if (!lead) return;
    const payload = activitySchema.parse(req.body);
    const log = await storage.addActivityLog({
      ...payload,
      id: `log_${randomUUID()}`,
      leadId: lead.id,
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
