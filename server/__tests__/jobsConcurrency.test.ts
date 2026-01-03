import express from "express";
import session from "express-session";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActivityLog, InsertJob, InsertUser, Job, Lead, User } from "@shared/schema";
import { SESSION_COOKIE_NAME } from "../session";
import type { IStorage } from "../storage";

const MemoryStore = session.MemoryStore;

vi.mock("../storageInstance", () => {
  const users = new Map<string, User>();
  const jobs = new Map<string, Job>();
  const activityLogs = new Map<string, ActivityLog>();
  const leads = new Map<string, Lead>();

  const storage: IStorage = {
    async getUser(id: string) {
      return users.get(id);
    },
    async getUserByEmail(email: string) {
      return Array.from(users.values()).find((user) => user.email.toLowerCase() === email.toLowerCase());
    },
    async createUser(user: InsertUser) {
      const record: User = { ...user, createdAt: user.createdAt ?? new Date() };
      users.set(record.id, record);
      return record;
    },
    async listUsers() {
      return Array.from(users.values()).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    },
    async updateUserApproval(id: string, approved: boolean) {
      const existing = users.get(id);
      if (!existing) return null;
      const updated: User = { ...existing, approved };
      users.set(id, updated);
      return updated;
    },
    async createJob(job: InsertJob) {
      const record: Job = {
        ...job,
        trade: job.trade ?? null,
        createdAt: job.createdAt ?? new Date(),
        updatedAt: job.updatedAt ?? new Date(),
      };
      jobs.set(record.id, record);
      return record;
    },
    async getJob(id: string) {
      return jobs.get(id) ?? null;
    },
    async listJobs() {
      return Array.from(jobs.values());
    },
    async updateJob() {
      throw new Error("Not implemented");
    },
    async setJobStatus(id: string, status: Job["status"]) {
      const existing = jobs.get(id);
      if (!existing) return null;
      const updated: Job = { ...existing, status, updatedAt: new Date() };
      jobs.set(id, updated);
      return updated;
    },
    async assignJob(id: string, assigneeId: string | null, options: { allowReassign?: boolean } = {}) {
      const existing = jobs.get(id);
      if (!existing) return null;

      if (!options.allowReassign) {
        if (existing.assigneeId) return null;
      }

      const updated: Job = { ...existing, assigneeId, updatedAt: new Date() };
      jobs.set(id, updated);
      return updated;
    },
    async claimJob(id: string, assigneeId: string) {
      const existing = jobs.get(id);
      if (!existing || existing.assigneeId) return null;
      const nextStatus = existing.status === "open" ? "in_progress" : existing.status;
      const updated: Job = { ...existing, assigneeId, status: nextStatus, updatedAt: new Date() };
      jobs.set(id, updated);
      return updated;
    },
    async addActivityLog(log) {
      const record: ActivityLog = { ...log, timestamp: log.timestamp ?? new Date() };
      activityLogs.set(record.id, record);
      return record;
    },
    async listJobActivity(jobId: string) {
      return Array.from(activityLogs.values()).filter((log) => log.jobId === jobId);
    },
    async createLead() {
      throw new Error("Not implemented");
    },
    async getLead(id: string) {
      return leads.get(id) ?? null;
    },
    async listLeads() {
      return [];
    },
    async updateLead() {
      throw new Error("Not implemented");
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
    async listServices() {
      return [];
    },
    async createService() {
      throw new Error("Not implemented");
    },
    async updateService() {
      throw new Error("Not implemented");
    },
  };

  return {
    storage,
    __reset: () => {
      users.clear();
      jobs.clear();
      activityLogs.clear();
      leads.clear();
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

  const storageModule = (await import("../storageInstance")) as unknown as { storage: IStorage };

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

  const { jobsRouter } = await import("../routes/jobs");
  app.use("/api/jobs", jobsRouter);
  return { app, storage: storageModule.storage };
};

describe("job claim and reassignment guards", () => {
  let app: express.Express;
  let storage: IStorage;
  let reset: () => void;

  beforeEach(async () => {
    const storageModule = (await import("../storageInstance")) as unknown as { storage: IStorage; __reset: () => void };
    reset = storageModule.__reset;
    reset();
    const setup = await createApp();
    app = setup.app;
    storage = setup.storage;
  });

  const createUser = (overrides: Partial<InsertUser> = {}) =>
    storage.createUser({
      id: overrides.id ?? `user_${Math.random().toString(16).slice(2)}`,
      email: overrides.email ?? "tester@example.com",
      role: overrides.role ?? "dual",
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

  const createJobRecord = async (ownerId: string, overrides: Partial<InsertJob> = {}) =>
    storage.createJob({
      id: overrides.id ?? `job_${Math.random().toString(16).slice(2)}`,
      title: overrides.title ?? "Test job",
      description: overrides.description ?? null,
      status: overrides.status ?? "open",
      ownerId,
      assigneeId: overrides.assigneeId ?? null,
      region: overrides.region ?? null,
      country: overrides.country ?? null,
      trade: overrides.trade ?? "general",
      createdAt: overrides.createdAt ?? new Date(),
      updatedAt: overrides.updatedAt ?? new Date(),
    });

  it("returns 409 and does not log when a concurrent claim loses", async () => {
    const owner = await createUser();
    const claimerOne = await createUser({ email: "one@example.com" });
    const claimerTwo = await createUser({ email: "two@example.com" });
    const job = await createJobRecord(owner.id);

    const agentOne = request.agent(app);
    const agentTwo = request.agent(app);
    await loginAgent(agentOne, claimerOne.id);
    await loginAgent(agentTwo, claimerTwo.id);

    await agentOne.post(`/api/jobs/${job.id}/claim`).expect(200);
    const resTwo = await agentTwo.post(`/api/jobs/${job.id}/claim`).expect(409);

    expect(resTwo.body.message).toBe("Job already assigned");
    const activity = await storage.listJobActivity(job.id);
    expect(activity.filter((log) => log.action === "job_claimed")).toHaveLength(1);
  });

  it("allows owner or admin to reassign even when already claimed", async () => {
    const owner = await createUser({ role: "admin" });
    const initialAssignee = await createUser({ email: "current@example.com" });
    const newAssignee = await createUser({ email: "new@example.com" });
    const job = await createJobRecord(owner.id, { assigneeId: initialAssignee.id, status: "in_progress" });

    const agent = request.agent(app);
    await loginAgent(agent, owner.id);

    const res = await agent.post(`/api/jobs/${job.id}/assign`).send({ assigneeId: newAssignee.id }).expect(200);
    expect(res.body.job.assigneeId).toBe(newAssignee.id);

    const activity = await storage.listJobActivity(job.id);
    expect(activity.find((log) => log.action === "job_assigned" && log.details.assigneeId === newAssignee.id)).toBeDefined();
  });
});
