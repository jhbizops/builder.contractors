import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { storage } from "../storageInstance";
import { generateSalt, hashPassword, verifyPassword } from "./authCrypto";
import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { DEFAULT_SESSION_MAX_AGE, REMEMBER_ME_SESSION_MAX_AGE, SESSION_COOKIE_NAME } from "../session";
import { toPublicUser } from "../users/serializers";
import { getBillingService } from "../billing/instance";
import { authLoginRateLimit, authRegisterRateLimit } from "../middleware/authRateLimit";
import {
  canConsumeBootstrapToken,
  consumeBootstrapToken,
  getAdminBootstrapSecurityConfig,
  getClientIp,
  isBootstrapIpAllowed,
  verifyBootstrapToken,
} from "../adminBootstrap";
import { log } from "../vite";

const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  country: z.string().optional(),
  region: z.string().optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
  languages: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

const bootstrapAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  token: z.string().min(1),
});

const privilegedRoles = new Set(["admin", "super_admin"]);
type ProcessEnv = Record<string, string | undefined>;

function getPublicRegistrationDefaultRole(env: ProcessEnv = process.env): string {
  const configured = env.PUBLIC_REGISTRATION_DEFAULT_ROLE?.trim().toLowerCase();
  if (!configured || privilegedRoles.has(configured)) {
    return "dual";
  }
  return configured;
}

async function tryAcquireAdminBootstrapGuard(email: string): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return true;
  }

  const { pool } = await import("../db");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["admin_bootstrap_guard"]);
    await client.query(
      `CREATE TABLE IF NOT EXISTS admin_bootstrap_state (
        id smallint PRIMARY KEY CHECK (id = 1),
        consumed_at timestamp NOT NULL DEFAULT now(),
        consumed_by text NOT NULL
      )`,
    );

    const existingAdmin = await client.query<{ id: string }>(
      `SELECT id FROM users WHERE role IN ('admin', 'super_admin') LIMIT 1`,
    );
    if (existingAdmin.rowCount && existingAdmin.rowCount > 0) {
      await client.query("ROLLBACK");
      return false;
    }

    const insert = await client.query(
      `INSERT INTO admin_bootstrap_state (id, consumed_at, consumed_by)
       VALUES (1, now(), $1)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [email],
    );

    await client.query("COMMIT");
    return (insert.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

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
      res.status(409).json({ message: "Unable to process the request." });
      return;
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(payload.password, salt);
    const role = getPublicRegistrationDefaultRole();

    const user = await storage.createUser({
      id: `user_${randomUUID()}`,
      email: payload.email,
      role,
      country: payload.country ?? null,
      region: payload.region ?? null,
      locale: payload.locale ?? null,
      currency: payload.currency ?? null,
      languages: payload.languages ?? [],
      approved: true,
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
    const sessionMaxAge = payload.rememberMe
      ? REMEMBER_ME_SESSION_MAX_AGE
      : DEFAULT_SESSION_MAX_AGE;
    req.session.cookie.maxAge = sessionMaxAge;
    req.session.cookie.expires = new Date(Date.now() + sessionMaxAge);
    req.session.cookie.originalMaxAge = sessionMaxAge;
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

const bootstrapAdminHandler: RequestHandler = async (req, res, next) => {
  const config = getAdminBootstrapSecurityConfig();
  const requestIp = getClientIp(req);
  const requestId = req.headers["x-request-id"];

  const audit = (outcome: "allowed" | "blocked", reason: string) => {
    log(
      JSON.stringify({
        event: "admin_bootstrap_attempt",
        outcome,
        reason,
        ip: requestIp,
        requestId: typeof requestId === "string" ? requestId : null,
      }),
      "security",
    );
  };

  try {
    if (!config.enabled) {
      audit("blocked", "feature_disabled");
      res.status(404).json({ message: "Not found" });
      return;
    }

    if (!config.token) {
      audit("blocked", "token_not_configured");
      res.status(500).json({ message: "Bootstrap is misconfigured." });
      return;
    }

    if (!isBootstrapIpAllowed(requestIp, config.allowedIps)) {
      audit("blocked", "ip_not_allowed");
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const payload = bootstrapAdminSchema.parse(req.body);

    if (!canConsumeBootstrapToken()) {
      audit("blocked", "token_already_used");
      res.status(409).json({ message: "Bootstrap token already used." });
      return;
    }

    if (!verifyBootstrapToken(payload.token, config.token)) {
      audit("blocked", "invalid_token");
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const canBootstrap = await tryAcquireAdminBootstrapGuard(payload.email);
    if (!canBootstrap) {
      audit("blocked", "admin_already_exists");
      res.status(409).json({ message: "Admin role is already assigned." });
      return;
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(payload.password, salt);

    const user = await storage.createUser({
      id: `user_${randomUUID()}`,
      email: payload.email,
      role: "admin",
      country: null,
      region: null,
      locale: null,
      currency: null,
      languages: [],
      approved: true,
      passwordHash,
      passwordSalt: salt,
    });

    consumeBootstrapToken();
    audit("allowed", "admin_created");

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
      audit("blocked", "invalid_payload");
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
};

authRouter.post("/register", authRegisterRateLimit, registerHandler);
authRouter.post("/login", authLoginRateLimit, loginHandler);
authRouter.post("/logout", logoutHandler);
authRouter.get("/me", meHandler);
authRouter.post("/bootstrap-admin", bootstrapAdminHandler);

export { authRouter };
