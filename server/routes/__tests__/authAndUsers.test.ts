import express from "express";
import session from "express-session";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SESSION_MAX_AGE,
  REMEMBER_ME_SESSION_MAX_AGE,
  SESSION_COOKIE_NAME,
} from "../../session";
import type { User } from "@shared/schema";
import type { IStorage } from "../../storage";
import { defaultBillingPlans } from "@shared/billingPlans";

const mockStore = new Map<string, User>();

vi.mock("../../storageInstance", () => {
  const storage: IStorage = {
    async getUser(id: string) {
      return mockStore.get(id);
    },
    async getUserByEmail(email: string) {
      for (const user of mockStore.values()) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          return user;
        }
      }
      return undefined;
    },
    async createUser(user) {
      const next: User = {
        ...user,
        createdAt: user.createdAt ?? new Date(),
      };
      mockStore.set(next.id, next);
      return next;
    },
    async listUsers() {
      return Array.from(mockStore.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    },
    async updateUserApproval(id: string, approved: boolean) {
      const existing = mockStore.get(id);
      if (!existing) {
        return null;
      }
      const updated: User = { ...existing, approved };
      mockStore.set(id, updated);
      return updated;
    },
    async getUserProfile() {
      return null;
    },
    async createJob() {
      throw new Error("Not implemented");
    },
    async getJob() {
      return null;
    },
    async listJobs() {
      return [];
    },
    async updateJob() {
      return null;
    },
    async setJobStatus() {
      return null;
    },
    async assignJob() {
      return null;
    },
    async claimJob() {
      return null;
    },
    async addActivityLog() {
      throw new Error("Not implemented");
    },
    async listJobActivity() {
      return [];
    },
    async createAd() {
      throw new Error("Not implemented");
    },
    async getAd() {
      return null;
    },
    async listAds() {
      return [];
    },
    async listAdCreatives() {
      return [];
    },
    async updateAdStatus() {
      return null;
    },
    async createAdReview() {
      throw new Error("Not implemented");
    },
    async listAdReviews() {
      return [];
    },
    async listAdInsights() {
      return [];
    },
    async createLead() {
      throw new Error("Not implemented");
    },
    async getLead() {
      return null;
    },
    async listLeads() {
      return [];
    },
    async updateLead() {
      return null;
    },
    async deleteLead() {
      return false;
    },
    async addLeadComment() {
      throw new Error("Not implemented");
    },
    async listLeadComments() {
      return [];
    },
    async listLeadActivity() {
      return [];
    },
    async createExportJob() {
      throw new Error("Not implemented");
    },
    async getExportJob() {
      return null;
    },
    async listExportJobs() {
      return [];
    },
    async updateExportJob() {
      return null;
    },
    async listServices() {
      return [];
    },
    async createService() {
      throw new Error("Not implemented");
    },
    async updateService() {
      return null;
    },
  };

  return {
    storage,
    __resetMockStorage: () => mockStore.clear(),
    __setUserRole: (id: string, role: User["role"]) => {
      const existing = mockStore.get(id);
      if (!existing) return;
      mockStore.set(id, { ...existing, role });
    },
  };
});

vi.mock("../../billing/instance", () => {
  const plan = defaultBillingPlans[0];
  return {
    getBillingService: () => ({
      getUserBilling: async (userId: string) => {
        const user = mockStore.get(userId);
        if (!user) return null;
        return {
          user,
          plan,
          subscription: null,
          entitlements: plan.entitlements,
          quotas: plan.quotas,
        };
      },
    }),
  };
});

const createApp = () => {
  const app = express();
  const MemoryStore = session.MemoryStore;
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore(),
      name: SESSION_COOKIE_NAME,
      cookie: {
        maxAge: DEFAULT_SESSION_MAX_AGE,
      },
    }),
  );
  app.use(express.json());
  return app;
};

const parseMaxAge = (setCookieHeader: string[] | string | undefined) => {
  if (!setCookieHeader) {
    return null;
  }
  const entries = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  if (entries.length === 0) {
    return null;
  }
  const cookie = entries.find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!cookie) {
    return null;
  }
  const match = cookie.match(/Max-Age=(\d+)/i);
  return match ? Number(match[1]) : null;
};

const parseExpiryDeltaSeconds = (setCookieHeader: string[] | string | undefined) => {
  if (!setCookieHeader) {
    return null;
  }
  const entries = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const cookie = entries.find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!cookie) {
    return null;
  }
  const match = cookie.match(/Expires=([^;]+)/i);
  if (!match) {
    return null;
  }
  const expiresAt = Date.parse(match[1]);
  if (Number.isNaN(expiresAt)) {
    return null;
  }
  return Math.round((expiresAt - Date.now()) / 1000);
};

describe("auth and users routes", () => {
  let app: express.Express;
  let resetStorage: () => void;

  beforeEach(async () => {
    const storageModule = (await import("../../storageInstance")) as unknown as {
      __resetMockStorage: () => void;
    };
    resetStorage = storageModule.__resetMockStorage;
    resetStorage();
    app = createApp();
    const { authRouter } = await import("../../auth/routes");
    const { usersRouter } = await import("../../users/routes");
    app.use("/api/auth", authRouter);
    app.use("/api/users", usersRouter);
    app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error("auth/users test error", err);
      res.status(500).json({ message: err instanceof Error ? err.message : String(err) });
    });
  });

  it("registers, logs out, and logs in a user", async () => {
    const agent = request.agent(app);

    const registerRes = await agent
      .post("/api/auth/register")
      .send({ email: "tester@example.com", password: "Password123!" })
      .expect(201);

    expect(registerRes.body.user.email).toBe("tester@example.com");
    expect(registerRes.body.user.approved).toBe(true);

    await agent.get("/api/auth/me").expect(200);

    await agent.post("/api/auth/logout").expect(204);
    await agent.get("/api/auth/me").expect(401);

    await agent
      .post("/api/auth/login")
      .send({ email: "tester@example.com", password: "Password123!" })
      .expect(200);

    await agent
      .post("/api/auth/login")
      .send({ email: "tester@example.com", password: "WrongPassword" })
      .expect(401);
  });

  it("extends session duration when remember me is enabled", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "fast@login.com", password: "Password123!" })
      .expect(201);

    const rememberRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "fast@login.com", password: "Password123!", rememberMe: true })
      .expect(200);

    const rememberMaxAge =
      parseMaxAge(rememberRes.headers["set-cookie"]) ??
      parseExpiryDeltaSeconds(rememberRes.headers["set-cookie"]);
    expect(rememberMaxAge).not.toBeNull();
    expect(rememberMaxAge).toBeGreaterThanOrEqual(REMEMBER_ME_SESSION_MAX_AGE / 1000 - 5);
    expect(rememberMaxAge).toBeLessThanOrEqual(REMEMBER_ME_SESSION_MAX_AGE / 1000 + 5);

    const defaultRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "fast@login.com", password: "Password123!", rememberMe: false })
      .expect(200);

    const defaultMaxAge =
      parseMaxAge(defaultRes.headers["set-cookie"]) ??
      parseExpiryDeltaSeconds(defaultRes.headers["set-cookie"]);
    expect(defaultMaxAge).not.toBeNull();
    expect(defaultMaxAge).toBeGreaterThanOrEqual(DEFAULT_SESSION_MAX_AGE / 1000 - 5);
    expect(defaultMaxAge).toBeLessThanOrEqual(DEFAULT_SESSION_MAX_AGE / 1000 + 5);
  });

  it("allows admins to list and approve users", async () => {
    const adminAgent = request.agent(app);
    const adminRes = await adminAgent
      .post("/api/auth/register")
      .send({ email: "admin@example.com", password: "AdminPass123!", role: "admin" })
      .expect(201);
    const storageModule = (await import("../../storageInstance")) as unknown as { storage: IStorage };
    const adminRecord = await storageModule.storage.getUser(adminRes.body.user.id);
    expect(adminRecord?.role).toBe("admin");
    await adminAgent
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "AdminPass123!" })
      .expect(200);

    const userAgent = request.agent(app);
    const userRes = await userAgent
      .post("/api/auth/register")
      .send({ email: "user@example.com", password: "UserPass123!" })
      .expect(201);

    const userId = userRes.body.user.id as string;

    const listRes = await adminAgent.get("/api/users");
    if (listRes.status !== 200) {
      console.error("users list response", listRes.status, listRes.body);
    }
    expect(listRes.status).toBe(200);
    expect(listRes.body.users).toHaveLength(2);

    const approvalRes = await adminAgent
      .patch(`/api/users/${userId}/approval`)
      .send({ approved: true })
      .expect(200);

    expect(approvalRes.body.user.approved).toBe(true);
    expect(approvalRes.body.user).not.toHaveProperty("passwordHash");
    expect(approvalRes.body.user).not.toHaveProperty("passwordSalt");

    await userAgent.get("/api/users").expect(403);
  });

  it("blocks additional admin registration once an admin exists", async () => {
    const adminAgent = request.agent(app);
    await adminAgent
      .post("/api/auth/register")
      .send({ email: "admin@example.com", password: "AdminPass123!", role: "admin" })
      .expect(201);

    await request(app)
      .post("/api/auth/register")
      .send({ email: "admin2@example.com", password: "AdminPass123!", role: "admin" })
      .expect(403);
  });
});
