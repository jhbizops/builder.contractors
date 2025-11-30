import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { storage } from "../storageInstance";
import { generateSalt, hashPassword, verifyPassword } from "./authCrypto";
import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { SESSION_COOKIE_NAME } from "../session";
import { toPublicUser } from "../users/serializers";
import { getBillingService } from "../billing/instance";

const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["sales", "builder", "admin", "dual"]),
  country: z.string().optional(),
  region: z.string().optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
  languages: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function ensureSessionRegenerated(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error: Error | null) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error: Error | null) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const existing = await storage.getUserByEmail(payload.email);

    if (existing) {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(payload.password, salt);

    const user = await storage.createUser({
      id: `user_${randomUUID()}`,
      email: payload.email,
      role: payload.role,
      country: payload.country ?? null,
      region: payload.region ?? null,
      locale: payload.locale ?? null,
      currency: payload.currency ?? null,
      languages: payload.languages ?? [],
      approved: payload.role === "admin",
      passwordHash,
      passwordSalt: salt,
    });

    await ensureSessionRegenerated(req);
    req.session.userId = user.id;
    req.session.userRole = user.role;
    await saveSession(req);

    const billingService = getBillingService();
    const profile = await billingService.getUserBilling(user.id);

    if (!profile) {
      res.status(500).json({ message: "Unable to build user profile" });
      return;
    }

    res.status(201).json({ user: toPublicUser(profile) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
};

const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await storage.getUserByEmail(payload.email);

    if (!user) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const isValid = await verifyPassword(payload.password, user.passwordSalt, user.passwordHash);

    if (!isValid) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    await ensureSessionRegenerated(req);
    req.session.userId = user.id;
    req.session.userRole = user.role;
    await saveSession(req);

    const billingService = getBillingService();
    const profile = await billingService.getUserBilling(user.id);

    if (!profile) {
      res.status(500).json({ message: "Unable to build user profile" });
      return;
    }

    res.json({ user: toPublicUser(profile) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
};

const meHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const billingService = getBillingService();
    const profile = await billingService.getUserBilling(req.session.userId);

    if (!profile) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    res.json({ user: toPublicUser(profile) });
  } catch (error) {
    next(error);
  }
};

const logoutHandler: RequestHandler = async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((error: Error | null) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    res.clearCookie(SESSION_COOKIE_NAME);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/logout", logoutHandler);
authRouter.get("/me", meHandler);

export { authRouter };
