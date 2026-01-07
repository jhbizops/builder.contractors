import express from "express";
import session from "express-session";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InsertUser, User } from "@shared/schema";
import { defaultBillingPlans } from "@shared/billingPlans";
import { SESSION_COOKIE_NAME } from "../session";
import type { IStorage } from "../storage";

vi.mock("../storageInstance", () => {
  const users = new Map<string, User>();

  const storage: IStorage = {
    async getUser(id: string) {
      return users.get(id);
    },
    async getUserByEmail(email: string) {
      return Array.from(users.values()).find((user) => user.email.toLowerCase() === email.toLowerCase());
    },
    async createUser(user: InsertUser) {
      const record: User = {
        ...user,
        createdAt: user.createdAt ?? new Date(),
      };
      users.set(record.id, record);
      return record;
    },
    async listUsers() {
      return Array.from(users.values()).sort(
        (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      );
    },
    async updateUserApproval(id: string, approved: boolean) {
      const existing = users.get(id);
      if (!existing) return null;
      const updated: User = { ...existing, approved };
      users.set(id, updated);
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
    __reset: () => users.clear(),
  };
});

vi.mock("../billing/instance", () => {
  const plan = defaultBillingPlans[0];
  return {
    getBillingService: () => ({
      getUserBilling: async (userId: string) => {
        const storageModule = (await import("../storageInstance")) as unknown as { storage: IStorage };
        const user = await storageModule.storage.getUser(userId);
        if (!user) return null;
        return {
          user,
          plan,
          subscription: null,
          entitlements: plan.entitlements,
          quotas: plan.quotas,
        };
      },
      ensurePlans: async () => [plan],
    }),
  };
});

const createApp = async () => {
  const app = express();
  const MemoryStore = session.MemoryStore;

  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore(),
      name: SESSION_COOKIE_NAME,
    }),
  );
  app.use(express.json());

  const { authRouter } = await import("../auth/routes");
  app.use("/api/auth", authRouter);
  return app;
};

describe("auth rate limiting", () => {
  let app: express.Express;
  let resetStorage: () => void;
  let resetRateLimits: () => void;

  beforeEach(async () => {
    const storageModule = (await import("../storageInstance")) as unknown as {
      storage: IStorage;
      __reset: () => void;
    };
    const rateLimitModule = await import("../middleware/authRateLimit");
    resetRateLimits = rateLimitModule.__resetAuthRateLimiters;
    resetRateLimits();
    resetStorage = storageModule.__reset;
    resetStorage();
    app = await createApp();
  });

  const registerUser = (agent: request.SuperTest<request.Test>, email = "tester@example.com") =>
    agent.post("/api/auth/register").send({ email, password: "Password123!" });

  it("throttles repeated failed login attempts and returns retry headers", async () => {
    const agent = request.agent(app);
    await registerUser(agent).expect(201);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await agent
        .post("/api/auth/login")
        .send({ email: "tester@example.com", password: "WrongPassword" })
        .expect(401);
    }

    const limited = await agent
      .post("/api/auth/login")
      .send({ email: "tester@example.com", password: "WrongPassword" })
      .expect(429);

    expect(limited.headers["retry-after"]).toBeDefined();
    expect(limited.body.message).toBe("Too many attempts. Please try again later.");
  });

  it("resets failed login counters after a successful login", async () => {
    const agent = request.agent(app);
    await registerUser(agent).expect(201);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await agent
        .post("/api/auth/login")
        .send({ email: "tester@example.com", password: "WrongPassword" })
        .expect(401);
    }

    await agent
      .post("/api/auth/login")
      .send({ email: "tester@example.com", password: "Password123!" })
      .expect(200);

    const postSuccessFailure = await agent
      .post("/api/auth/login")
      .send({ email: "tester@example.com", password: "WrongPassword" })
      .expect(401);

    expect(postSuccessFailure.headers["retry-after"]).toBeUndefined();
  });

  it("limits registration attempts per ip and email", async () => {
    const agent = request.agent(app);

    for (let attempt = 0; attempt < 12; attempt += 1) {
      await registerUser(agent, `user${attempt}@example.com`).expect(201);
    }

    const limited = await registerUser(agent, "blocked@example.com").expect(429);

    expect(limited.headers["retry-after"]).toBeDefined();
    expect(limited.body.message).toBe("Too many attempts. Please try again later.");
  });
});
