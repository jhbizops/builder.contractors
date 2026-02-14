import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@shared/schema";
import { defaultBillingPlans } from "@shared/billingPlans";
import { BillingService } from "../billing/service";
import type { UserProfile } from "../storage";
import { ZodError } from "zod";

class InMemoryStorage {
  private plans: schema.BillingPlan[] = defaultBillingPlans.map((plan) => ({
    ...plan,
    providerPriceId: plan.providerPriceId ?? null,
  })) as schema.BillingPlan[];
  private users = new Map<string, schema.User>();
  private subs = new Map<string, schema.Subscription>();
  private entitlements = new Map<string, schema.UserEntitlement>();
  upsertEntitlementsCalls = 0;

  async getUser(id: string) {
    return this.users.get(id);
  }

  async getUserByEmail(email: string) {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: schema.InsertUser) {
    const user: schema.User = { ...insertUser, createdAt: new Date() } as schema.User;
    this.users.set(user.id, user);
    return user;
  }

  async listPlans() {
    return this.plans;
  }

  async upsertBillingPlans(plans: schema.InsertBillingPlan[]) {
    plans.forEach((plan) => {
      const existingIndex = this.plans.findIndex((p) => p.id === plan.id);
      const nextPlan = { ...plan, providerPriceId: plan.providerPriceId ?? null } as schema.BillingPlan;
      if (existingIndex >= 0) {
        this.plans[existingIndex] = nextPlan;
      } else {
        this.plans.push(nextPlan);
      }
    });
    return this.plans;
  }

  async getPlan(planId: string) {
    return this.plans.find((plan) => plan.id === planId) ?? null;
  }

  async getSubscriptionForUser(userId: string) {
    return this.subs.get(userId) ?? null;
  }

  async upsertSubscription(subscription: schema.InsertSubscription) {
    const record: schema.Subscription = { ...subscription } as schema.Subscription;
    this.subs.set(subscription.userId, record);
    return record;
  }

  async setSubscriptionCancellation(userId: string, cancelAtPeriodEnd: boolean) {
    const subscription = this.subs.get(userId);
    if (!subscription) return null;
    const updated = { ...subscription, cancelAtPeriodEnd };
    this.subs.set(userId, updated);
    return updated;
  }

  async setSubscriptionStatus(
    providerSubscriptionId: string,
    status: schema.Subscription["status"],
    planId?: string,
    currentPeriodEnd?: Date | null,
  ) {
    const found = Array.from(this.subs.values()).find(
      (sub) => sub.providerSubscriptionId === providerSubscriptionId,
    );
    if (!found) return null;
    const updated: schema.Subscription = {
      ...found,
      status,
      planId: planId ?? found.planId,
      currentPeriodEnd: currentPeriodEnd ?? found.currentPeriodEnd,
    };
    this.subs.set(found.userId, updated);
    return updated;
  }

  async upsertUserEntitlements(data: schema.InsertUserEntitlement) {
    const record: schema.UserEntitlement = {
      ...data,
      updatedAt: new Date(),
    } as schema.UserEntitlement;
    this.entitlements.set(data.userId, record);
    this.upsertEntitlementsCalls += 1;
    return record;
  }

  async getUserProfile(userId: string) {
    const user = this.users.get(userId);
    if (!user) return null;
    const subscription = this.subs.get(userId) ?? null;
    const plan = this.plans.find((plan) => plan.id === (subscription?.planId ?? "free"));
    if (!plan) return null;

    const entitlementRecord = this.entitlements.get(userId);
    const entitlements = entitlementRecord?.features ?? plan.entitlements;
    const quotas = entitlementRecord?.quotas ?? plan.quotas;

    return {
      user,
      subscription,
      plan,
      entitlements,
      quotas,
      hasEntitlementsRecord: Boolean(entitlementRecord),
    } as UserProfile;
  }
}

describe("BillingService", () => {
  let storage: InMemoryStorage;
  let service: BillingService;

  beforeEach(async () => {
    storage = new InMemoryStorage();
    service = new BillingService(storage as unknown as any, null);
    await service.ensurePlans();
  });

  it("seeds default plans", async () => {
    const plans = await storage.listPlans();
    expect(plans.length).toBe(defaultBillingPlans.length);
    expect(plans.find((p) => p.id === "free")?.isDefault).toBe(true);
  });

  it("returns billing profile with entitlements", async () => {
    const user = await storage.createUser({
      id: "user_1",
      email: "billing@example.com",
      role: "sales",
      country: null,
      region: null,
      locale: null,
      currency: null,
      languages: [],
      approved: true,
      passwordHash: "hash",
      passwordSalt: "salt",
    });

    const profile = await service.getUserBilling(user.id);
    expect(profile?.plan.id).toBe("free");
    expect(profile?.entitlements).toContain("dashboard.basic");
    expect(profile?.quotas.leads).toBeGreaterThan(0);
  });

  it("avoids rewriting entitlements when already hydrated", async () => {
    const user = await storage.createUser({
      id: "user_2",
      email: "fast@example.com",
      role: "sales",
      country: null,
      region: null,
      locale: null,
      currency: null,
      languages: [],
      approved: true,
      passwordHash: "hash",
      passwordSalt: "salt",
    });

    await storage.upsertSubscription({
      id: "sub_user_2",
      userId: user.id,
      planId: "free",
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      provider: "stripe",
      providerCustomerId: null,
      providerSubscriptionId: null,
      metadata: {},
    });

    await storage.upsertUserEntitlements({
      userId: user.id,
      features: ["dashboard.basic"],
      quotas: { leads: 50, seats: 1, storageGb: 1, workspaces: 1 },
    });

    storage.upsertEntitlementsCalls = 0;
    const profile = await service.getUserBilling(user.id);

    expect(profile?.entitlements).toContain("dashboard.basic");
    expect(storage.upsertEntitlementsCalls).toBe(0);
  });

  it("validates checkout payloads before Stripe configuration checks", async () => {
    await expect(
      service.createCheckoutSession("user_1", {
        planId: "invalid",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      }),
    ).rejects.toBeInstanceOf(ZodError);
  });
});
