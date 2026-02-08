import { Router, type Response } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { jobStatusEnum, type Job } from "@shared/schema";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storageInstance";

const jobsRouter = Router();

const requiredTrimmedString = (message: string) => z.string().trim().min(1, message);
const optionalTrimmedString = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const createJobSchema = z.object({
  title: requiredTrimmedString("Title is required"),
  description: optionalTrimmedString,
  privateDetails: optionalTrimmedString,
  region: optionalTrimmedString,
  country: optionalTrimmedString,
  trade: requiredTrimmedString("Trade is required"),
});

const updateJobSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: optionalTrimmedString,
  privateDetails: optionalTrimmedString,
  region: optionalTrimmedString,
  country: optionalTrimmedString,
  trade: z.string().trim().min(1).optional(),
});

const statusSchema = z.object({
  status: jobStatusEnum,
});

const assignSchema = z.object({
  assigneeId: z.string().nullable(),
});

const inviteSchema = z.object({
  emails: z.array(z.string().email()).min(1, "At least one email is required").max(10),
  message: optionalTrimmedString,
});

const filterSchema = z.object({
  ownerId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  trade: z.string().optional(),
});

const attachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional(),
  kind: z.string().optional(),
});

const activityNoteSchema = z.object({
  note: z.string().min(1, "Note is required"),
  kind: z.enum(["comment", "collaboration_request"]).default("comment"),
  attachments: z.array(attachmentSchema).max(5).optional(),
});

function parseListFilters(query: unknown) {
  const raw = filterSchema.parse(query);

  const parseList = (value?: string) =>
    value?.split(",").map((v) => v.trim()).filter(Boolean) ?? undefined;

  const statuses = parseList(raw.status);
  if (statuses) {
    const invalidStatus = statuses.find((status) => !jobStatusEnum.safeParse(status).success);
    if (invalidStatus) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: `Invalid status: ${invalidStatus}`,
          path: ["status"],
        },
      ]);
    }
  }

  return {
    ownerId: raw.ownerId,
    assigneeId: raw.assigneeId,
    status: statuses,
    region: parseList(raw.region),
    country: parseList(raw.country),
    trade: parseList(raw.trade),
  };
}

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

function isAdmin(role: string | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

function isBuilder(role: string | undefined): boolean {
  return role === "builder" || role === "dual";
}

function isApprovedBuilder(user: AuthenticatedUser): boolean {
  return user.approved && isBuilder(user.role);
}

function canViewPrivateDetails(job: Job, user: AuthenticatedUser): boolean {
  return isAdmin(user.role) || job.ownerId === user.id || job.assigneeId === user.id;
}

function sanitizeJob(job: Job, user: AuthenticatedUser): Job {
  if (canViewPrivateDetails(job, user)) {
    return job;
  }

  return { ...job, privateDetails: null };
}

jobsRouter.use(requireAuth);

jobsRouter.get("/", async (req, res, next) => {
  try {
    const filters = parseListFilters(req.query);
    const user = getUser(res);
    const jobs = await storage.listJobs(filters);
    res.json({ jobs: jobs.map((job) => sanitizeJob(job, user)) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

jobsRouter.post("/", async (req, res, next) => {
  try {
    const payload = createJobSchema.parse(req.body);
    const user = getUser(res);

    if (!isApprovedBuilder(user) && !isAdmin(user.role)) {
      res.status(403).json({ message: "Only approved builders can post jobs" });
      return;
    }

    const job = await storage.createJob({
      id: `job_${randomUUID()}`,
      title: payload.title,
      description: payload.description ?? null,
      privateDetails: payload.privateDetails ?? null,
      region: payload.region ?? null,
      country: payload.country ?? null,
      trade: payload.trade ?? null,
      ownerId: user.id,
      assigneeId: null,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await storage.addActivityLog({
      id: `log_${randomUUID()}`,
      jobId: job.id,
      leadId: null,
      action: "job_created",
      performedBy: user.id,
      details: { title: job.title },
    });

    res.status(201).json({ job: sanitizeJob(job, user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

jobsRouter.get("/:id/activity", async (req, res, next) => {
  try {
    const job = await storage.getJob(req.params.id);
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }
    const activity = await storage.listJobActivity(job.id);
    res.json({ activity });
  } catch (error) {
    next(error);
  }
});

jobsRouter.patch("/:id", async (req, res, next) => {
  try {
    const payload = updateJobSchema.parse(req.body);
    const job = await storage.getJob(req.params.id);
    const user = getUser(res);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (job.ownerId !== user.id && !isAdmin(user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const updated = await storage.updateJob(job.id, { ...payload, updatedAt: new Date() });
    res.json({ job: updated ? sanitizeJob(updated, user) : updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

jobsRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const payload = statusSchema.parse(req.body);
    const job = await storage.getJob(req.params.id);
    const user = getUser(res);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    const isOwnerOrAdmin = job.ownerId === user.id || isAdmin(user.role);
    const isAssignee = job.assigneeId === user.id;

    if (!isOwnerOrAdmin && !isAssignee) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const updated = await storage.setJobStatus(job.id, payload.status);

    await storage.addActivityLog({
      id: `log_${randomUUID()}`,
      jobId: job.id,
      leadId: null,
      action: "job_status_changed",
      performedBy: user.id,
      details: { from: job.status, to: payload.status },
    });

    res.json({ job: updated ? sanitizeJob(updated, user) : updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

jobsRouter.post("/:id/assign", async (req, res, next) => {
  try {
    const payload = assignSchema.parse(req.body);
    const job = await storage.getJob(req.params.id);
    const user = getUser(res);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (!isApprovedBuilder(user) && !isAdmin(user.role)) {
      res.status(403).json({ message: "Approval required to assign jobs" });
      return;
    }

    const isOwnerOrAdmin = job.ownerId === user.id || isAdmin(user.role);

    if (!isOwnerOrAdmin) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const isReassignment = job.assigneeId !== null && payload.assigneeId !== job.assigneeId;
    const updated = await storage.assignJob(job.id, payload.assigneeId, {
      allowReassign: isReassignment,
    });

    if (!updated) {
      res.status(409).json({ message: "Job already assigned" });
      return;
    }

    await storage.addActivityLog({
      id: `log_${randomUUID()}`,
      jobId: job.id,
      leadId: null,
      action: payload.assigneeId ? "job_assigned" : "job_unassigned",
      performedBy: user.id,
      details: { previousAssigneeId: job.assigneeId, assigneeId: payload.assigneeId },
    });

    res.json({ job: updated ? sanitizeJob(updated, user) : updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

jobsRouter.post("/:id/claim", async (req, res, next) => {
  try {
    const job = await storage.getJob(req.params.id);
    const user = getUser(res);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (!isApprovedBuilder(user) && !isAdmin(user.role)) {
      res.status(403).json({ message: "Approval required to claim jobs" });
      return;
    }

    if (!isBuilder(user.role) && !isAdmin(user.role)) {
      res.status(403).json({ message: "Only builders can claim jobs" });
      return;
    }

    const claimed = await storage.claimJob(job.id, user.id);

    if (!claimed) {
      res.status(409).json({ message: "Job already assigned" });
      return;
    }

    await storage.addActivityLog({
      id: `log_${randomUUID()}`,
      jobId: job.id,
      leadId: null,
      action: "job_claimed",
      performedBy: user.id,
      details: { assigneeId: user.id },
    });

    res.json({ job: claimed ? sanitizeJob(claimed, user) : claimed });
  } catch (error) {
    next(error);
  }
});

jobsRouter.post("/:id/invite", async (req, res, next) => {
  try {
    const payload = inviteSchema.parse(req.body);
    const job = await storage.getJob(req.params.id);
    const user = getUser(res);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (!isApprovedBuilder(user) && !isAdmin(user.role)) {
      res.status(403).json({ message: "Approval required to invite collaborators" });
      return;
    }

    if (job.ownerId !== user.id && !isAdmin(user.role)) {
      res.status(403).json({ message: "Only job owners can invite collaborators" });
      return;
    }

    const normalizedEmails = Array.from(
      new Set(payload.emails.map((email) => email.trim().toLowerCase())),
    );

    await storage.addActivityLog({
      id: `log_${randomUUID()}`,
      jobId: job.id,
      leadId: null,
      action: "job_invite_sent",
      performedBy: user.id,
      details: {
        invited: normalizedEmails,
        message: payload.message ?? null,
      },
    });

    res.status(201).json({
      invite: {
        jobId: job.id,
        invited: normalizedEmails,
        message: payload.message ?? null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

jobsRouter.post("/:id/activity", async (req, res, next) => {
  try {
    const payload = activityNoteSchema.parse(req.body);
    const job = await storage.getJob(req.params.id);
    const user = getUser(res);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (!isApprovedBuilder(user) && !isAdmin(user.role)) {
      res.status(403).json({ message: "Approval required to collaborate" });
      return;
    }

    const isOwnerOrAssignee = job.ownerId === user.id || job.assigneeId === user.id;
    const isCollaborationRequest = payload.kind === "collaboration_request";

    if (!isOwnerOrAssignee && !isAdmin(user.role) && !isCollaborationRequest) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const activity = await storage.addActivityLog({
      id: `log_${randomUUID()}`,
      jobId: job.id,
      leadId: null,
      action: isCollaborationRequest ? "job_collaboration_request" : "job_comment",
      performedBy: user.id,
      details: {
        note: payload.note,
        kind: payload.kind,
        attachments: payload.attachments ?? [],
      },
    });

    res.status(201).json({ activity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

export { jobsRouter };
