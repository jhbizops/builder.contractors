import express from "express";
import session from "express-session";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Ad, AdReview, InsertAd, InsertAdReview, InsertUser, User } from "@shared/schema";
import { SESSION_COOKIE_NAME } from "../../session";
import type { AdInsightsRow, IStorage } from "../../storage";

const MemoryStore = session.MemoryStore;

vi.mock("../../storageInstance", () => {
  const users = new Map<string, User>();
  const ads = new Map<string, Ad>();
  const reviews = new Map<string, AdReview>();
  let insightsRows: AdInsightsRow[] = [];

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
    async createAd(ad: InsertAd) {
      const record: Ad = {
        ...ad,
        targeting: ad.targeting ?? {},
        updatedBy: ad.updatedBy ?? null,
        createdAt: ad.createdAt ?? new Date(),
        updatedAt: ad.updatedAt ?? new Date(),
      };
      ads.set(record.id, record);
      return record;
    },
    async getAd(id: string) {
      return ads.get(id) ?? null;
    },
    async listAds(filters = {}) {
      const statuses = filters.status ? (Array.isArray(filters.status) ? filters.status : [filters.status]) : null;
      return Array.from(ads.values()).filter((ad) => (statuses ? statuses.includes(ad.status) : true));
    },
    async listAdCreatives() {
      return [];
    },
    async updateAdStatus(id: string, status: Ad["status"], updatedBy: string) {
      const existing = ads.get(id);
      if (!existing) return null;
      const updated: Ad = { ...existing, status, updatedBy, updatedAt: new Date() };
      ads.set(id, updated);
      return updated;
    },
    async createAdReview(review: InsertAdReview) {
      const record: AdReview = {
        ...review,
        notes: review.notes ?? null,
        result: review.result ?? {},
        createdAt: review.createdAt ?? new Date(),
        updatedAt: review.updatedAt ?? new Date(),
      };
      reviews.set(record.id, record);
      return record;
    },
    async listAdReviews(adId: string) {
      return Array.from(reviews.values())
        .filter((review) => review.adId === adId)
        .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    },
    async listAdInsights() {
      return insightsRows;
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
    __reset: () => {
      users.clear();
      ads.clear();
      reviews.clear();
      insightsRows = [];
    },
    __setInsights: (rows: AdInsightsRow[]) => {
      insightsRows = rows;
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

  const { adsRouter } = await import("../ads");
  app.use("/api/ads", adsRouter);
  return { app, storage: storageModule.storage };
};

describe("ads router", () => {
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
      email: overrides.email ?? "builder@example.com",
      role: overrides.role ?? "builder",
      country: overrides.country ?? null,
      region: overrides.region ?? null,
      locale: overrides.locale ?? null,
      currency: overrides.currency ?? null,
      languages: overrides.languages ?? ["en"],
      approved: overrides.approved ?? true,
      passwordHash: overrides.passwordHash ?? "hash",
      passwordSalt: overrides.passwordSalt ?? "salt",
      createdAt: overrides.createdAt ?? new Date(),
    });

  it("creates ads for approved users", async () => {
    const user = await createUser();
    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: user.id }).expect(204);

    const response = await agent.post("/api/ads").send({
      name: "Launch Ad",
      targeting: { region: "APAC" },
    });

    expect(response.status).toBe(201);
    expect(response.body.ad.status).toBe("draft");
    expect(response.body.ad.advertiserId).toBe(user.id);
  });

  it("rejects ad creation for unapproved users", async () => {
    const user = await createUser({ approved: false });
    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: user.id }).expect(204);

    const response = await agent.post("/api/ads").send({ name: "Blocked Ad" });
    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Approval required to create ads");
  });

  it("blocks publishing without an approved review", async () => {
    const user = await createUser({ role: "admin" });
    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: user.id }).expect(204);

    const ad = await storage.createAd({
      id: "ad_1",
      advertiserId: user.id,
      name: "Needs Review",
      targeting: {},
      status: "pending_review",
      createdBy: user.email,
      updatedBy: user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await agent.patch(`/api/ads/${ad.id}/status`).send({ status: "approved" });
    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Ad requires approval before publishing");
  });

  it("submits reviews and updates status", async () => {
    const admin = await createUser({ role: "admin" });
    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: admin.id }).expect(204);

    const ad = await storage.createAd({
      id: "ad_2",
      advertiserId: admin.id,
      name: "Review Me",
      targeting: {},
      status: "pending_review",
      createdBy: admin.email,
      updatedBy: admin.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await agent.post(`/api/ads/${ad.id}/reviews`).send({
      status: "approved",
      notes: "Looks good",
    });

    expect(response.status).toBe(201);
    const updated = await storage.getAd(ad.id);
    expect(updated?.status).toBe("approved");
  });

  it("returns k-anonymized insights", async () => {
    const user = await createUser();
    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: user.id }).expect(204);

    const storageModule = (await import("../../storageInstance")) as unknown as {
      __setInsights: (rows: AdInsightsRow[]) => void;
    };

    storageModule.__setInsights([
      { trade: "plumbing", region: "NSW", count: 7 },
      { trade: "electrical", region: "VIC", count: 3 },
      { trade: null, region: "QLD", count: 12 },
    ]);

    const response = await agent.get("/api/ads/insights");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      minimumCount: 5,
      insights: [{ trade: "plumbing", region: "NSW", count: 7 }],
    });
  });
});
