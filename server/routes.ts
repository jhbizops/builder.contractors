import type { Express, Request, Response, NextFunction } from "express";
import { Router } from "express";
import session from "express-session";
import connectMemorystore from "memorystore";
import { createServer, type Server } from "http";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { storage, type StoredUser } from "./storage";
import { hashPassword, verifyPassword } from "./auth";
import { leadFileSchema } from "@shared/schema";

const MemoryStore = connectMemorystore(session);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be defined`);
  }
  return value;
}

function asyncHandler<
  TReq extends Request,
  TRes extends Response,
  TNext extends NextFunction
>(handler: (req: TReq, res: TRes, next: TNext) => Promise<void | Response>) {
  return (req: TReq, res: TRes, next: TNext) => {
    handler(req, res, next).catch(next);
  };
}

function toUserResponse(user: StoredUser) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    country: user.country ?? null,
    region: user.region ?? null,
    approved: user.approved,
    createdAt: user.createdAt.toISOString(),
  };
}

function toLeadResponse(lead: Awaited<ReturnType<typeof storage.listLeads>>[number]) {
  return {
    ...lead,
    country: lead.country ?? null,
    region: lead.region ?? null,
    updatedBy: lead.updatedBy ?? null,
    files: lead.files.map((file) => ({
      ...file,
      uploadedAt: file.uploadedAt,
    })),
    createdAt: lead.createdAt instanceof Date ? lead.createdAt.toISOString() : lead.createdAt,
    updatedAt: lead.updatedAt instanceof Date ? lead.updatedAt.toISOString() : lead.updatedAt,
  };
}

function toCommentResponse(comment: Awaited<ReturnType<typeof storage.createLeadComment>>) {
  return {
    ...comment,
    timestamp: comment.timestamp instanceof Date
      ? comment.timestamp.toISOString()
      : comment.timestamp,
  };
}

function toActivityLogResponse(log: Awaited<ReturnType<typeof storage.createActivityLog>>) {
  return {
    ...log,
    leadId: log.leadId ?? null,
    timestamp: log.timestamp instanceof Date
      ? log.timestamp.toISOString()
      : log.timestamp,
  };
}

function toServiceResponse(service: Awaited<ReturnType<typeof storage.createService>>) {
  return {
    ...service,
    description: service.description ?? null,
    imageUrl: service.imageUrl ?? null,
  };
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser || req.currentUser.role !== "admin") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["sales", "builder", "admin", "dual"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const leadFileInputSchema = leadFileSchema.extend({
  uploadedAt: z.string().optional(),
});

const createLeadSchema = z.object({
  partnerId: z.string().optional(),
  clientName: z.string().min(1),
  status: z.enum(["new", "in_progress", "completed", "on_hold"]),
  location: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  notes: z.array(z.string()).optional(),
  files: z.array(leadFileInputSchema).optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional().nullable(),
});

const updateLeadSchema = createLeadSchema.partial();

const createLeadCommentSchema = z.object({
  leadId: z.string().min(1),
  body: z.string().min(1),
  author: z.string().min(1),
});

const createActivityLogSchema = z.object({
  leadId: z.string().optional(),
  action: z.string().min(1),
  performedBy: z.string().min(1),
});

const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  unit: z.string().min(1),
  basePrice: z.number().nonnegative(),
  imageUrl: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

const updateServiceSchema = createServiceSchema.partial();

const updateUserSchema = z.object({
  role: z.enum(["sales", "builder", "admin", "dual"]).optional(),
  country: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  approved: z.boolean().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  const sessionSecret = requireEnv("SESSION_SECRET");

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      name: "elyment.sid",
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: app.get("env") !== "development",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
      store: new MemoryStore({
        checkPeriod: 1000 * 60 * 60 * 24,
      }),
    }),
  );

  app.use(
    asyncHandler(async (req, _res, next) => {
      if (!req.session.userId) {
        next();
        return;
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        delete req.session.userId;
        next();
        return;
      }

      req.currentUser = user;
      next();
    }),
  );

  const router = Router();

  router.get(
    "/auth/session",
    asyncHandler(async (req, res) => {
      if (!req.currentUser) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      res.json(toUserResponse(req.currentUser));
    }),
  );

  router.post(
    "/auth/register",
    asyncHandler(async (req, res) => {
      const body = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(body.email);
      if (existing) {
        res.status(409).json({ message: "An account with this email already exists" });
        return;
      }

      const password = await hashPassword(body.password);
      const user = await storage.createUser({
        email: body.email.toLowerCase(),
        role: body.role,
        passwordHash: password.hash,
        passwordSalt: password.salt,
        passwordIterations: password.iterations,
        approved: body.role === 'admin',
      });

      req.session.userId = user.id;
      res.status(201).json(toUserResponse(user));
    }),
  );

  router.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
      const body = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(body.email);
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const valid = await verifyPassword(body.password, {
        hash: user.passwordHash,
        salt: user.passwordSalt,
        iterations: user.passwordIterations,
      });

      if (!valid) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      req.session.userId = user.id;
      res.json(toUserResponse(user));
    }),
  );

  router.post(
    "/auth/logout",
    requireAuth,
    asyncHandler(async (req, res) => {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) {
            reject(err);
            return;
          }

          res.clearCookie("elyment.sid");
          resolve();
        });
      });

      res.status(204).send();
    }),
  );

  router.get(
    "/users",
    requireAuth,
    requireAdmin,
    asyncHandler(async (_req, res) => {
      const users = await storage.listUsers();
      res.json(users.map((user) => toUserResponse(user)));
    }),
  );

  router.patch(
    "/users/:id",
    requireAuth,
    requireAdmin,
    asyncHandler(async (req, res) => {
      const updates = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(req.params.id, updates);
      res.json(toUserResponse(user));
    }),
  );

  router.get(
    "/leads",
    requireAuth,
    asyncHandler(async (_req, res) => {
      const leads = await storage.listLeads();
      res.json(leads.map((lead) => toLeadResponse(lead)));
    }),
  );

  router.post(
    "/leads",
    requireAuth,
    asyncHandler(async (req, res) => {
      const body = createLeadSchema.parse(req.body);
      const user = req.currentUser as StoredUser;
      const nowIso = new Date().toISOString();
      const lead = await storage.createLead({
        partnerId: user.id,
        clientName: body.clientName,
        status: body.status,
        location: body.location ?? undefined,
        country: body.country ?? undefined,
        region: body.region ?? undefined,
        notes: body.notes ?? [],
        files:
          body.files?.map((file) => ({
            id: file.id ?? randomUUID(),
            name: file.name,
            dataUrl: file.dataUrl,
            uploadedAt: file.uploadedAt ?? nowIso,
          })) ?? [],
        createdBy: user.email,
        updatedBy: body.updatedBy ?? user.email,
      });

      res.status(201).json(toLeadResponse(lead));
    }),
  );

  router.get(
    "/leads/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        res.status(404).json({ message: "Lead not found" });
        return;
      }

      res.json(toLeadResponse(lead));
    }),
  );

  router.patch(
    "/leads/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      const body = updateLeadSchema.parse(req.body);
      const updates = { ...body };
      if (body.files) {
        updates.files = body.files.map((file) => ({
          id: file.id ?? randomUUID(),
          name: file.name,
          dataUrl: file.dataUrl,
          uploadedAt: file.uploadedAt ?? new Date().toISOString(),
        }));
      }

      const lead = await storage.updateLead(req.params.id, updates);
      res.json(toLeadResponse(lead));
    }),
  );

  router.delete(
    "/leads/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      await storage.deleteLead(req.params.id);
      res.status(204).send();
    }),
  );

  router.get(
    "/lead-comments",
    requireAuth,
    asyncHandler(async (req, res) => {
      const leadId = typeof req.query.leadId === "string" ? req.query.leadId : undefined;
      const comments = await storage.listLeadComments({ leadId });
      res.json(comments.map((comment) => toCommentResponse(comment)));
    }),
  );

  router.post(
    "/lead-comments",
    requireAuth,
    asyncHandler(async (req, res) => {
      const body = createLeadCommentSchema.parse(req.body);
      const comment = await storage.createLeadComment(body);
      res.status(201).json(toCommentResponse(comment));
    }),
  );

  router.get(
    "/activity-logs",
    requireAuth,
    asyncHandler(async (req, res) => {
      const leadId = typeof req.query.leadId === "string" ? req.query.leadId : undefined;
      const logs = await storage.listActivityLogs({ leadId });
      res.json(logs.map((log) => toActivityLogResponse(log)));
    }),
  );

  router.post(
    "/activity-logs",
    requireAuth,
    asyncHandler(async (req, res) => {
      const body = createActivityLogSchema.parse(req.body);
      const log = await storage.createActivityLog(body);
      res.status(201).json(toActivityLogResponse(log));
    }),
  );

  router.get(
    "/services",
    requireAuth,
    asyncHandler(async (_req, res) => {
      const services = await storage.listServices();
      res.json(services.map((service) => toServiceResponse(service)));
    }),
  );

  router.post(
    "/services",
    requireAuth,
    asyncHandler(async (req, res) => {
      const body = createServiceSchema.parse(req.body);
      const service = await storage.createService(body);
      res.status(201).json(toServiceResponse(service));
    }),
  );

  router.patch(
    "/services/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      const body = updateServiceSchema.parse(req.body);
      const service = await storage.updateService(req.params.id, body);
      res.json(toServiceResponse(service));
    }),
  );

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
