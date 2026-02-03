import express from "express";
import session from "express-session";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InsertLead, InsertUser, Lead, User } from "@shared/schema";
import type { IStorage, UserProfile } from "../../storage";
import { SESSION_COOKIE_NAME } from "../../session";

const MemoryStore = session.MemoryStore;

vi.mock("../../storageInstance", () => {
  const users = new Map<string, User>();
  const leads = new Map<string, Lead>();
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
      return Array.from(users.values());
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
    async listAdInsights() {
      return [];
    },
    async createLead(lead: InsertLead) {
      const record: Lead = {
        ...lead,
        updatedBy: lead.updatedBy ?? null,
        createdAt: lead.createdAt ?? new Date(),
        updatedAt: lead.updatedAt ?? new Date(),
      };
      leads.set(record.id, record);
      return record;
    },
    async getLead(id: string) {
      return leads.get(id) ?? null;
    },
    async listLeads() {
      return Array.from(leads.values());
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
    __reset: () => {
      users.clear();
      leads.clear();
      profiles.clear();
    },
    __setProfile: (userId: string, profile: UserProfile) => {
      profiles.set(userId, profile);
    },
    __setLead: (lead: Lead) => {
      leads.set(lead.id, lead);
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

  const { adminRouter } = await import("../admin");
  app.use("/api/admin", adminRouter);
  return { app, storage: storageModule.storage };
};

describe("admin router", () => {
  let app: express.Express;
  let storage: IStorage;
  let reset: () => void;
  let setProfile: (userId: string, profile: UserProfile) => void;
  let setLead: (lead: Lead) => void;

  beforeEach(async () => {
    const storageModule = (await import("../../storageInstance")) as unknown as {
      storage: IStorage;
      __reset: () => void;
      __setProfile: (userId: string, profile: UserProfile) => void;
      __setLead: (lead: Lead) => void;
    };
    reset = storageModule.__reset;
    setProfile = storageModule.__setProfile;
    setLead = storageModule.__setLead;
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
      createdAt: overrides.createdAt ?? new Date(),
    });

  it("requires authentication", async () => {
    await request(app).get("/api/admin/metrics").expect(401);
  });

  it("forbids non-admin users", async () => {
    const user = await createUser({ role: "sales" });
    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: user.id }).expect(204);
    await agent.get("/api/admin/metrics").expect(403);
  });

  it("allows admins to fetch metrics", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });
    const member = await createUser({ role: "builder", email: "builder@example.com", approved: false });

    const plan = {
      id: "pro",
      name: "Pro",
      description: null,
      interval: "month",
      priceCents: 12000,
      currency: "usd",
      entitlements: [],
      quotas: { leads: 10, seats: 1, storageGb: 1, workspaces: 1 },
      isDefault: false,
      providerPriceId: null,
    };

    setProfile(admin.id, {
      user: admin,
      subscription: {
        id: "sub_admin",
        userId: admin.id,
        planId: plan.id,
        status: "active",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        provider: "stripe",
        providerCustomerId: null,
        providerSubscriptionId: null,
        metadata: {},
      },
      plan,
      entitlements: [],
      quotas: plan.quotas,
    });

    setProfile(member.id, {
      user: member,
      subscription: {
        id: "sub_member",
        userId: member.id,
        planId: plan.id,
        status: "canceled",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        provider: "stripe",
        providerCustomerId: null,
        providerSubscriptionId: null,
        metadata: {},
      },
      plan,
      entitlements: [],
      quotas: plan.quotas,
    });

    setLead({
      id: "lead_active",
      partnerId: admin.id,
      clientName: "Active Lead",
      status: "in_progress",
      location: null,
      country: null,
      region: null,
      notes: [],
      files: [],
      createdBy: admin.email,
      updatedBy: admin.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: admin.id }).expect(204);
    const res = await agent.get("/api/admin/metrics").expect(200);

    expect(res.body.metrics).toEqual({
      totalUsers: 2,
      activeLeads: 1,
      pendingApprovals: 1,
      monthlyRevenue: 120,
    });
  });
});
