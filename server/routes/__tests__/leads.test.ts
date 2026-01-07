import express from "express";
import session from "express-session";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActivityLog, InsertLead, InsertUser, Lead, LeadComment, User } from "@shared/schema";
import { SESSION_COOKIE_NAME } from "../../session";
import type { IStorage } from "../../storage";

const MemoryStore = session.MemoryStore;

vi.mock("../../storageInstance", () => {
  const users = new Map<string, User>();
  const leads = new Map<string, Lead>();
  const leadComments = new Map<string, LeadComment>();
  const activities = new Map<string, ActivityLog>();
  let lastListFilters: unknown = null;

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
      lastListFilters = filters;
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
    __reset: () => {
      users.clear();
      leads.clear();
      leadComments.clear();
      activities.clear();
      lastListFilters = null;
    },
    __getState: () => ({ lastListFilters }),
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

  const { leadsRouter } = await import("../leads");
  app.use("/api/leads", leadsRouter);
  return { app, storage: storageModule.storage };
};

describe("leads router (integration)", () => {
  let app: express.Express;
  let storage: IStorage;
  let reset: () => void;
  let getState: () => { lastListFilters: unknown };

  beforeEach(async () => {
    const storageModule = (await import("../../storageInstance")) as unknown as {
      storage: IStorage;
      __reset: () => void;
      __getState: () => { lastListFilters: unknown };
    };
    reset = storageModule.__reset;
    getState = storageModule.__getState;
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

  it("requires approval to create or update leads", async () => {
    const user = await createUser({ approved: false });
    const agent = request.agent(app);
    await loginAgent(agent, user.id);

    await agent.post("/api/leads").send({ clientName: "Client" }).expect(403);

    const lead = await storage.createLead({
      id: "lead_unapproved",
      partnerId: user.id,
      clientName: "Client",
      status: "new",
      location: null,
      country: null,
      region: null,
      notes: [],
      files: [],
      createdBy: user.email,
      updatedBy: user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await agent.patch(`/api/leads/${lead.id}`).send({ status: "completed" }).expect(403);
  });

  it("scopes listing and reading to the owner unless admin", async () => {
    const owner = await createUser({ id: "owner", email: "owner@example.com" });
    const other = await createUser({ id: "other", email: "other@example.com" });
    const admin = await createUser({ id: "admin", role: "admin", email: "admin@example.com" });

    await storage.createLead({
      id: "lead_owner",
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

    await storage.createLead({
      id: "lead_other",
      partnerId: other.id,
      clientName: "Other Client",
      status: "new",
      location: null,
      country: null,
      region: null,
      notes: [],
      files: [],
      createdBy: other.email,
      updatedBy: other.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ownerAgent = request.agent(app);
    await loginAgent(ownerAgent, owner.id);
    const listRes = await ownerAgent.get("/api/leads").expect(200);
    expect(listRes.body.leads).toHaveLength(1);
    expect(listRes.body.leads[0].id).toBe("lead_owner");
    expect(getState().lastListFilters).toMatchObject({ partnerId: owner.id });
    await ownerAgent.get("/api/leads/lead_other").expect(403);

    const adminAgent = request.agent(app);
    await loginAgent(adminAgent, admin.id);
    const adminList = await adminAgent.get("/api/leads").expect(200);
    expect(adminList.body.leads).toHaveLength(2);
    expect(getState().lastListFilters).toMatchObject({ partnerId: undefined });
    await adminAgent.get("/api/leads/lead_other").expect(200);
  });

  it("enforces ownership for updates, deletion, comments, and activity", async () => {
    const owner = await createUser({ id: "owner" });
    const other = await createUser({ id: "intruder", email: "intruder@example.com" });

    const lead = await storage.createLead({
      id: "lead_secure",
      partnerId: owner.id,
      clientName: "Secure",
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

    const intruderAgent = request.agent(app);
    await loginAgent(intruderAgent, other.id);
    await intruderAgent.patch(`/api/leads/${lead.id}`).send({ clientName: "Hijack" }).expect(403);
    await intruderAgent.delete(`/api/leads/${lead.id}`).expect(403);
    await intruderAgent.get(`/api/leads/${lead.id}/comments`).expect(403);
    await intruderAgent.get(`/api/leads/${lead.id}/activity`).expect(403);
    await intruderAgent.post(`/api/leads/${lead.id}/comments`).send({ body: "nope" }).expect(403);
    await intruderAgent.post(`/api/leads/${lead.id}/activity`).send({ action: "note", details: {} }).expect(403);

    const ownerAgent = request.agent(app);
    await loginAgent(ownerAgent, owner.id);
    await ownerAgent.patch(`/api/leads/${lead.id}`).send({ clientName: "Updated" }).expect(200);
    await ownerAgent
      .post(`/api/leads/${lead.id}/comments`)
      .send({ body: "Allowed" })
      .expect(201);
    await ownerAgent
      .post(`/api/leads/${lead.id}/activity`)
      .send({ action: "note", details: { text: "ok" } })
      .expect(201);
    await ownerAgent.get(`/api/leads/${lead.id}/comments`).expect(200);
    await ownerAgent.get(`/api/leads/${lead.id}/activity`).expect(200);
  });
});
