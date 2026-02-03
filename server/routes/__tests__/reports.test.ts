import express from "express";
import session from "express-session";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExportJob, InsertExportJob, InsertUser, User } from "@shared/schema";
import { defaultBillingPlans } from "@shared/billingPlans";
import { SESSION_COOKIE_NAME } from "../../session";
import type { IStorage, UserProfile } from "../../storage";

const MemoryStore = session.MemoryStore;

vi.mock("../../reports/storage", () => ({
  writeExportFile: vi.fn(async () => "/tmp/fake-export.csv"),
  buildExportDownloadUrl: (id: string) => `/api/reports/exports/${id}/download`,
  getExportFilePath: (id: string) => `/tmp/${id}.csv`,
}));

vi.mock("../../storageInstance", () => {
  const users = new Map<string, User>();
  const exports = new Map<string, ExportJob>();
  const profiles = new Map<string, UserProfile>();

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
    async getUserProfile(userId: string) {
      return profiles.get(userId) ?? null;
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
    async updateAdStatus() {
      return null;
    },
    async createAdReview() {
      throw new Error("Not implemented");
    },
    async listAdReviews() {
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
    async createExportJob(exportJob: InsertExportJob) {
      const record: ExportJob = {
        ...exportJob,
        status: exportJob.status ?? "queued",
        fileUrl: exportJob.fileUrl ?? null,
        createdAt: exportJob.createdAt ?? new Date(),
        updatedAt: exportJob.updatedAt ?? new Date(),
      };
      exports.set(record.id, record);
      return record;
    },
    async getExportJob(id: string, options = {}) {
      const record = exports.get(id);
      if (!record) return null;
      if (options.createdBy && record.createdBy !== options.createdBy) return null;
      if (options.tenantId && record.tenantId !== options.tenantId) return null;
      return record;
    },
    async listExportJobs(filters = {}) {
      return Array.from(exports.values()).filter((record) => {
        if (filters.createdBy && record.createdBy !== filters.createdBy) return false;
        if (filters.tenantId && record.tenantId !== filters.tenantId) return false;
        return true;
      });
    },
    async updateExportJob(id: string, updates) {
      const existing = exports.get(id);
      if (!existing) return null;
      const updated: ExportJob = { ...existing, ...updates, updatedAt: updates.updatedAt ?? new Date() };
      exports.set(id, updated);
      return updated;
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
    __reset: () => {
      users.clear();
      exports.clear();
      profiles.clear();
    },
    __setProfile: (userId: string, profile: UserProfile) => {
      profiles.set(userId, profile);
    },
  };
});

const createApp = async () => {
  const app = express();
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

  const storageModule = (await import("../../storageInstance")) as unknown as {
    storage: IStorage;
  };

  app.post("/test/login", async (req, res) => {
    const userId = req.body.userId as string;
    const user = await storageModule.storage.getUser(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    req.session.userId = user.id;
    req.session.userRole = user.role;
    res.status(204).send();
  });

  const { reportsRouter } = await import("../reports");
  app.use("/api/reports", reportsRouter);
  return { app, storage: storageModule.storage };
};

describe("reports router", () => {
  let app: express.Express;
  let storage: IStorage;
  let reset: () => void;
  let setProfile: (userId: string, profile: UserProfile) => void;

  beforeEach(async () => {
    const storageModule = (await import("../../storageInstance")) as unknown as {
      storage: IStorage;
      __reset: () => void;
      __setProfile: (userId: string, profile: UserProfile) => void;
    };
    reset = storageModule.__reset;
    setProfile = storageModule.__setProfile;
    reset();
    const setup = await createApp();
    app = setup.app;
    storage = setup.storage;
  });

  const createUser = (overrides: Partial<InsertUser> = {}) =>
    storage.createUser({
      id: overrides.id ?? `user_${Math.random().toString(16).slice(2)}`,
      email: overrides.email ?? "tester@example.com",
      role: overrides.role ?? "sales",
      country: overrides.country ?? null,
      region: overrides.region ?? null,
      locale: overrides.locale ?? null,
      currency: overrides.currency ?? null,
      languages: overrides.languages ?? [],
      approved: overrides.approved ?? true,
      passwordHash: overrides.passwordHash ?? "hash",
      passwordSalt: overrides.passwordSalt ?? "salt",
      createdAt: new Date(),
    });

  const loginAgent = async (agent: request.SuperAgentTest, userId: string) => {
    await agent.post("/test/login").send({ userId }).expect(204);
  };

  const attachProfile = (user: User, entitlements: string[]) => {
    const plan = defaultBillingPlans[0];
    setProfile(user.id, {
      user,
      plan,
      subscription: null,
      entitlements,
      quotas: plan.quotas,
    });
  };

  it("creates an export job for entitled users", async () => {
    const user = await createUser();
    attachProfile(user, ["reports.export"]);

    const agent = request.agent(app);
    await loginAgent(agent, user.id);

    const response = await agent
      .post("/api/reports/exports")
      .send({ filters: { report: "leads" } })
      .expect(201);

    expect(response.body.export).toBeDefined();
    expect(response.body.export.status).toBe("completed");
    expect(response.body.export.fileUrl).toBe(`/api/reports/exports/${response.body.export.id}/download`);
  });

  it("rejects users without entitlements", async () => {
    const user = await createUser();
    attachProfile(user, []);

    const agent = request.agent(app);
    await loginAgent(agent, user.id);

    const response = await agent
      .post("/api/reports/exports")
      .send({ filters: { report: "jobs" } })
      .expect(403);

    expect(response.body.message).toBe("Report exports are not enabled");
  });

  it("rejects unapproved users", async () => {
    const user = await createUser({ approved: false });
    attachProfile(user, ["reports.export"]);

    const agent = request.agent(app);
    await loginAgent(agent, user.id);

    const response = await agent
      .post("/api/reports/exports")
      .send({ filters: { report: "leads" } })
      .expect(403);

    expect(response.body.message).toBe("Approval required to export reports");
  });

  it("lists and fetches export jobs", async () => {
    const user = await createUser();
    attachProfile(user, ["reports.export"]);

    await storage.createExportJob({
      id: "export_123",
      status: "completed",
      filters: { report: "leads" },
      fileUrl: "/api/reports/exports/export_123/download",
      createdBy: user.id,
      tenantId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const agent = request.agent(app);
    await loginAgent(agent, user.id);

    const listResponse = await agent.get("/api/reports/exports").expect(200);
    expect(listResponse.body.exports).toHaveLength(1);
    expect(listResponse.body.exports[0].id).toBe("export_123");

    const getResponse = await agent.get("/api/reports/exports/export_123").expect(200);
    expect(getResponse.body.export.id).toBe("export_123");
  });

  it("rejects export downloads for users without entitlements", async () => {
    const user = await createUser();
    attachProfile(user, []);

    await storage.createExportJob({
      id: "export_456",
      status: "completed",
      filters: { report: "leads" },
      fileUrl: "/api/reports/exports/export_456/download",
      createdBy: user.id,
      tenantId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const agent = request.agent(app);
    await loginAgent(agent, user.id);

    const response = await agent.get("/api/reports/exports/export_456/download").expect(403);
    expect(response.body.message).toBe("Report exports are not enabled");
  });
});
