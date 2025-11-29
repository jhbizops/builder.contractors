import { desc, eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import {
  billingPlans,
  subscriptions,
  userEntitlements,
  users,
  type BillingPlan,
  type InsertBillingPlan,
  type InsertSubscription,
  type InsertUser,
  type InsertUserEntitlement,
  type PlanQuota,
  type Subscription,
  type User,
  type UserEntitlement,
} from "@shared/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUserApproval(id: string, approved: boolean): Promise<User | null>;
}

export interface UserProfile {
  user: User;
  plan: BillingPlan;
  subscription: Subscription | null;
  entitlements: string[];
  quotas: PlanQuota;
}

export class DatabaseStorage implements IStorage {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async getUser(id: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(insertUser).returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }
    return user;
  }

  async listUsers(): Promise<User[]> {
    return this.db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserApproval(id: string, approved: boolean): Promise<User | null> {
    const [user] = await this.db
      .update(users)
      .set({ approved })
      .where(eq(users.id, id))
      .returning();

    return user ?? null;
  }

  async upsertBillingPlans(plans: InsertBillingPlan[]): Promise<BillingPlan[]> {
    const inserted = await this.db
      .insert(billingPlans)
      .values(plans)
      .onConflictDoUpdate({
        target: billingPlans.id,
        set: {
          name: billingPlans.name,
          description: billingPlans.description,
          interval: billingPlans.interval,
          priceCents: billingPlans.priceCents,
          currency: billingPlans.currency,
          entitlements: billingPlans.entitlements,
          quotas: billingPlans.quotas,
          isDefault: billingPlans.isDefault,
          providerPriceId: billingPlans.providerPriceId,
        },
      })
      .returning();

    return inserted;
  }

  async listPlans(): Promise<BillingPlan[]> {
    return this.db.select().from(billingPlans).orderBy(billingPlans.priceCents);
  }

  async getSubscriptionForUser(userId: string): Promise<Subscription | null> {
    const subscription = await this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    return subscription ?? null;
  }

  async upsertSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [record] = await this.db
      .insert(subscriptions)
      .values(subscription)
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          planId: subscription.planId,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          provider: subscription.provider,
          providerCustomerId: subscription.providerCustomerId,
          providerSubscriptionId: subscription.providerSubscriptionId,
          metadata: subscription.metadata,
        },
      })
      .returning();

    if (!record) {
      throw new Error("Failed to persist subscription");
    }

    return record;
  }

  async setSubscriptionCancellation(
    userId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<Subscription | null> {
    const [record] = await this.db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd })
      .where(eq(subscriptions.userId, userId))
      .returning();

    return record ?? null;
  }

  async setSubscriptionStatus(
    providerSubscriptionId: string,
    status: Subscription["status"],
    planId?: string,
    currentPeriodEnd?: Date | null,
  ): Promise<Subscription | null> {
    const [record] = await this.db
      .update(subscriptions)
      .set({
        status,
        planId: planId ?? subscriptions.planId,
        currentPeriodEnd: currentPeriodEnd ?? subscriptions.currentPeriodEnd,
      })
      .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId))
      .returning();

    return record ?? null;
  }

  async getPlan(planId: string): Promise<BillingPlan | null> {
    const plan = await this.db.query.billingPlans.findFirst({
      where: eq(billingPlans.id, planId),
    });

    return plan ?? null;
  }

  async upsertUserEntitlements(
    data: InsertUserEntitlement,
  ): Promise<UserEntitlement> {
    const [record] = await this.db
      .insert(userEntitlements)
      .values(data)
      .onConflictDoUpdate({
        target: userEntitlements.userId,
        set: { features: data.features, quotas: data.quotas, updatedAt: new Date() },
      })
      .returning();

    if (!record) {
      throw new Error("Failed to persist entitlements");
    }

    return record;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.getUser(userId);

    if (!user) {
      return null;
    }

    const subscription = await this.getSubscriptionForUser(userId);
    const planId = subscription?.planId ?? "free";
    const plan = (await this.getPlan(planId)) ?? null;

    if (!plan) {
      return null;
    }

    const userEntitlementRecord = await this.db.query.userEntitlements.findFirst({
      where: eq(userEntitlements.userId, userId),
    });

    const entitlements = userEntitlementRecord?.features ?? plan.entitlements;
    const quotas = userEntitlementRecord?.quotas ?? plan.quotas;

    return { user, subscription, plan, entitlements, quotas };
  }
}
