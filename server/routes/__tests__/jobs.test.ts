import express from "express";
import session from "express-session";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InsertUser, Job, ActivityLog } from "@shared/schema";
import { SESSION_COOKIE_NAME } from "../../session";
import type { IStorage } from "../../storage";

const MemoryStore = session.MemoryStore;

vi.mock("../../storageInstance", () => {
  const users = new Map<string, User>();
  const jobs = new Map<string, Job>();
  const activityLogs = new Map<string, ActivityLog>();

  const storage: IStorage = {
    async getUser(id: string) {
      return users.get(id);
    },
    async getUserByEmail(email: string) {
      return Array.from(users.values()).find(
        (user) => user.email.toLowerCase() === email.toLowerCase(),
      );
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
    async createJob(job: InsertJob) {
      const record: Job = {
        ...job,
        createdAt: job.createdAt ?? new Date(),
        updatedAt: job.updatedAt ?? new Date(),
      };
      jobs.set(record.id, record);
      return record;
    },
    async getJob(id: string) {
      return jobs.get(id) ?? null;
    },
    async listJobs(filters = {}) {
      return Array.from(jobs.values()).filter((job) => {
        if (filters.ownerId && job.ownerId !== filters.ownerId) return false;
        if (filters.assigneeId && job.assigneeId !== filters.assigneeId) return false;
        if (filters.status) {
          const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
          if (!statuses.includes(job.status)) return false;
        }
        if (filters.region) {
          const regions = Array.isArray(filters.region) ? filters.region : [filters.region];
          if (!job.region || !regions.includes(job.region)) return false;
        }
        if (filters.country) {
          const countries = Array.isArray(filters.country) ? filters.country : [filters.country];
          if (!job.country || !countries.includes(job.country)) return false;
        }
        return true;
      });
    },
    async updateJob(id: string, updates) {
      const existing = jobs.get(id);
      if (!existing) return null;
      const updated: Job = { ...existing, ...updates };
      jobs.set(id, updated);
      return updated;
    },
    async setJobStatus(id: string, status: Job["status"]) {
      const existing = jobs.get(id);
      if (!existing) return null;
      const updated: Job = { ...existing, status, updatedAt: new Date() };
      jobs.set(id, updated);
      return updated;
    },
    async assignJob(id: string, assigneeId: string | null) {
      const existing = jobs.get(id);
      if (!existing) return null;
      const updated: Job = { ...existing, assigneeId, updatedAt: new Date() };
      jobs.set(id, updated);
      return updated;
    },
    async addActivityLog(log) {
      const record: ActivityLog = {
        ...log,
        timestamp: log.timestamp ?? new Date(),
      };
      activityLogs.set(record.id, record);
      return record;
    },
    async listJobActivity(jobId: string) {
      return Array.from(activityLogs.values()).filter((log) => log.jobId === jobId);
    },
  };

  return {
    storage,
    __reset: () => {
      users.clear();
      jobs.clear();
      activityLogs.clear();
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

  const { jobsRouter } = await import("../jobs");
  app.use("/api/jobs", jobsRouter);
  return { app, storage: storageModule.storage };
};

describe("jobs router", () => {
  let app: express.Express;
  let storage: IStorage;
  let reset: () => void;

  beforeEach(async () => {
    const storageModule = (await import("../../storageInstance")) as unknown as {
      storage: IStorage;
      __reset: () => void;
    };
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

  it("requires authentication", async () => {
    await request(app).get("/api/jobs").expect(401);
  });

  it("creates a job and logs activity", async () => {
    const owner = await createUser();
    const agent = request.agent(app);
    await loginAgent(agent, owner.id);

    const res = await agent
      .post("/api/jobs")
      .send({ title: "New job", region: "apac" })
      .expect(201);

    expect(res.body.job.ownerId).toBe(owner.id);
    expect(res.body.job.status).toBe("open");

    const activity = await agent.get(`/api/jobs/${res.body.job.id}/activity`).expect(200);
    expect(activity.body.activity).toHaveLength(1);
    expect(activity.body.activity[0]?.action).toBe("job_created");
  });

  it("filters jobs by owner and status", async () => {
    const owner = await createUser();
    const other = await createUser({ email: "other@example.com" });
    const agent = request.agent(app);
    await loginAgent(agent, owner.id);

    await storage.createJob({
      id: "job_1",
      title: "Owner job",
      description: null,
      status: "open",
      ownerId: owner.id,
      assigneeId: null,
      region: "apac",
      country: "AU",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await storage.createJob({
      id: "job_2",
      title: "Other job",
      description: null,
      status: "completed",
      ownerId: other.id,
      assigneeId: null,
      region: "na",
      country: "US",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await agent.get("/api/jobs").query({ ownerId: owner.id, status: "open" }).expect(200);
    expect(res.body.jobs).toHaveLength(1);
    expect(res.body.jobs[0]?.id).toBe("job_1");
  });

  it("allows owners to update details but blocks others", async () => {
    const owner = await createUser();
    const other = await createUser({ email: "other@example.com" });
    const job = await storage.createJob({
      id: "job_update",
      title: "Original",
      description: null,
      status: "open",
      ownerId: owner.id,
      assigneeId: null,
      region: null,
      country: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ownerAgent = request.agent(app);
    await loginAgent(ownerAgent, owner.id);
    const updateRes = await ownerAgent
      .patch(`/api/jobs/${job.id}`)
      .send({ title: "Updated title" })
      .expect(200);

    expect(updateRes.body.job.title).toBe("Updated title");

    const otherAgent = request.agent(app);
    await loginAgent(otherAgent, other.id);
    await otherAgent.patch(`/api/jobs/${job.id}`).send({ title: "Hacker" }).expect(403);
  });

  it("lets assignees update status and records activity", async () => {
    const owner = await createUser();
    const assignee = await createUser({ email: "assignee@example.com" });
    const job = await storage.createJob({
      id: "job_status",
      title: "Status job",
      description: null,
      status: "open",
      ownerId: owner.id,
      assigneeId: assignee.id,
      region: null,
      country: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const agent = request.agent(app);
    await loginAgent(agent, assignee.id);

    const res = await agent
      .patch(`/api/jobs/${job.id}/status`)
      .send({ status: "completed" })
      .expect(200);

    expect(res.body.job.status).toBe("completed");

    const activity = await agent.get(`/api/jobs/${job.id}/activity`).expect(200);
    expect(activity.body.activity.find((log: ActivityLog) => log.action === "job_status_changed")).toBeDefined();
  });

  it("allows claiming unassigned jobs", async () => {
    const owner = await createUser();
    const claimer = await createUser({ email: "claim@example.com" });
    const job = await storage.createJob({
      id: "job_claim",
      title: "Claim me",
      description: null,
      status: "open",
      ownerId: owner.id,
      assigneeId: null,
      region: null,
      country: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const agent = request.agent(app);
    await loginAgent(agent, claimer.id);

    const res = await agent.post(`/api/jobs/${job.id}/claim`).expect(200);
    expect(res.body.job.assigneeId).toBe(claimer.id);
    expect(res.body.job.status).toBe("in_progress");
  });

  it("permits admins to assign jobs", async () => {
    const owner = await createUser({ role: "admin", email: "admin@example.com" });
    const assignee = await createUser({ email: "target@example.com" });
    const job = await storage.createJob({
      id: "job_assign",
      title: "Assign",
      description: null,
      status: "open",
      ownerId: owner.id,
      assigneeId: null,
      region: null,
      country: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const agent = request.agent(app);
    await loginAgent(agent, owner.id);

    const res = await agent
      .post(`/api/jobs/${job.id}/assign`)
      .send({ assigneeId: assignee.id })
      .expect(200);

    expect(res.body.job.assigneeId).toBe(assignee.id);
  });
});
