import express from "express";
import session from "express-session";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActivityLog, InsertLead, InsertUser, Lead, LeadComment, User } from "@shared/schema";
import { SESSION_COOKIE_NAME } from "../session";
import type { IStorage } from "../storage";

const MemoryStore = session.MemoryStore;

vi.mock("../storageInstance", () => {
  const users = new Map<string, User>();
  const leads = new Map<string, Lead>();
  const leadComments = new Map<string, LeadComment>();
  const activities = new Map<string, ActivityLog>();

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
    async addActivityLog(log) {
      const record: ActivityLog = { ...log, timestamp: log.timestamp ?? new Date() };
      activities.set(record.id, record);
      return record;
    },
    async listJobActivity() {
      return [];
    },
    async createLead(lead: InsertLead) {
      const record: Lead = {
        ...lead,
        location: lead.location ?? null,
        country: lead.country ?? null,
        region: lead.region ?? null,
        notes: lead.notes ?? [],
        files: lead.files ?? [],
        createdAt: lead.createdAt ?? new Date(),
        updatedAt: lead.updatedAt ?? new Date(),
      };
      leads.set(record.id, record);
      return record;
    },
    async getLead(id: string, options = {}) {
      const lead = leads.get(id);
      if (!lead) return null;
      if (options.partnerId && lead.partnerId !== options.partnerId) return null;
      return lead;
    },
    async listLeads(filters = {}) {
      return Array.from(leads.values()).filter((lead) => {
        if (filters.partnerId && lead.partnerId !== filters.partnerId) return false;
        if (filters.status) {
          const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
          if (!statuses.includes(lead.status)) return false;
        }
        if (filters.region) {
          const regions = Array.isArray(filters.region) ? filters.region : [filters.region];
          if (lead.region && !regions.includes(lead.region)) return false;
        }
        if (filters.country) {
          const countries = Array.isArray(filters.country) ? filters.country : [filters.country];
          if (lead.country && !countries.includes(lead.country)) return false;
        }
        return true;
      });
    },
    async updateLead(id: string, updates, options = {}) {
      const lead = leads.get(id);
      if (!lead) return null;
      if (options.partnerId && lead.partnerId !== options.partnerId) return null;
      const updated: Lead = { ...lead, ...updates, updatedAt: updates.updatedAt ?? new Date() };
      leads.set(id, updated);
      return updated;
    },
    async deleteLead(id: string, options = {}) {
      const lead = leads.get(id);
      if (!lead) return false;
      if (options.partnerId && lead.partnerId !== options.partnerId) return false;
      leads.delete(id);
      return true;
    },
    async addLeadComment(comment: LeadComment) {
      const record: LeadComment = { ...comment, timestamp: comment.timestamp ?? new Date() };
      leadComments.set(record.id, record);
      return record;
    },
    async listLeadComments(leadId: string, options = {}) {
      const lead = leads.get(leadId);
      if (!lead) return [];
      if (options.partnerId && lead.partnerId !== options.partnerId) return [];
      return Array.from(leadComments.values())
        .filter((comment) => comment.leadId === leadId)
        .sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
    },
    async listLeadActivity(leadId: string, options = {}) {
      const lead = leads.get(leadId);
      if (!lead) return [];
      if (options.partnerId && lead.partnerId !== options.partnerId) return [];
      return Array.from(activities.values())
        .filter((log) => log.leadId === leadId)
        .sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
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
      leads.clear();
      leadComments.clear();
      activities.clear();
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

  const storageModule = (await import("../storageInstance")) as unknown as {
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

  const { leadsRouter } = await import("../routes/leads");
  app.use("/api/leads", leadsRouter);
  return { app, storage: storageModule.storage };
};

describe("leads router", () => {
  let app: express.Express;
  let storage: IStorage;
  let reset: () => void;

  beforeEach(async () => {
    const storageModule = (await import("../storageInstance")) as unknown as {
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
      role: overrides.role ?? "partner",
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
    await request(app).get("/api/leads").expect(401);
  });

  it("blocks unapproved users from creating leads", async () => {
    const user = await createUser({ approved: false });
    const agent = request.agent(app);
    await loginAgent(agent, user.id);

    await agent.post("/api/leads").send({ clientName: "Client" }).expect(403);
  });

  it("allows approved owners to create, list, and update their leads", async () => {
    const user = await createUser();
    const agent = request.agent(app);
    await loginAgent(agent, user.id);

    const createRes = await agent.post("/api/leads").send({ clientName: "My Client" }).expect(201);
    expect(createRes.body.lead.partnerId).toBe(user.id);

    const listRes = await agent.get("/api/leads").expect(200);
    expect(listRes.body.leads).toHaveLength(1);

    const updateRes = await agent
      .patch(`/api/leads/${createRes.body.lead.id}`)
      .send({ status: "completed" })
      .expect(200);
    expect(updateRes.body.lead.status).toBe("completed");
  });

  it("prevents other partners from mutating or reading another lead", async () => {
    const owner = await createUser();
    const other = await createUser({ email: "other@example.com" });
    await storage.createLead({
      id: "lead_1",
      partnerId: owner.id,
      clientName: "Owner Client",
      status: "new",
      location: null,
      country: null,
      region: null,
      notes: [],
      files: [],
      createdBy: owner.email,
      updatedBy: owner.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const otherAgent = request.agent(app);
    await loginAgent(otherAgent, other.id);

    await otherAgent.patch("/api/leads/lead_1").send({ clientName: "Hacker" }).expect(404);
    await otherAgent.delete("/api/leads/lead_1").expect(404);
    await otherAgent.get("/api/leads/lead_1/comments").expect(404);
  });

  it("allows admins to access and update any lead", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });
    const owner = await createUser({ email: "owner@example.com" });
    await storage.createLead({
      id: "lead_admin",
      partnerId: owner.id,
      clientName: "Owner Client",
      status: "new",
      location: null,
      country: null,
      region: null,
      notes: [],
      files: [],
      createdBy: owner.email,
      updatedBy: owner.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const agent = request.agent(app);
    await loginAgent(agent, admin.id);

    const res = await agent.patch("/api/leads/lead_admin").send({ clientName: "Updated" }).expect(200);
    expect(res.body.lead.clientName).toBe("Updated");

    const comments = await agent.get("/api/leads/lead_admin/comments").expect(200);
    expect(comments.body.comments).toEqual([]);
  });

  it("allows owners to comment and record activity while blocking unapproved users", async () => {
    const owner = await createUser();
    const unapproved = await createUser({ id: "user_unapproved", email: "bad@example.com", approved: false });
    const lead = await storage.createLead({
      id: "lead_comments",
      partnerId: owner.id,
      clientName: "Owner Client",
      status: "new",
      location: null,
      country: null,
      region: null,
      notes: [],
      files: [],
      createdBy: owner.email,
      updatedBy: owner.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ownerAgent = request.agent(app);
    await loginAgent(ownerAgent, owner.id);
    const commentRes = await ownerAgent
      .post(`/api/leads/${lead.id}/comments`)
      .send({ body: "First comment" })
      .expect(201);
    expect(commentRes.body.comment.body).toBe("First comment");

    const activityRes = await ownerAgent
      .post(`/api/leads/${lead.id}/activity`)
      .send({ action: "note", details: { note: "Something" } })
      .expect(201);
    expect(activityRes.body.log.action).toBe("note");

    const unapprovedAgent = request.agent(app);
    await loginAgent(unapprovedAgent, unapproved.id);
    await unapprovedAgent.post(`/api/leads/${lead.id}/comments`).send({ body: "Blocked" }).expect(403);
  });
});
