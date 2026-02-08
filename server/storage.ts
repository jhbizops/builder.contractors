import { and, desc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import * as schema from "@shared/schema";
import {
  billingPlans,
  subscriptions,
  userEntitlements,
  users,
  jobs,
  exportsTable,
  activityLogs,
  leads,
  leadComments,
  services,
  type BillingPlan,
  type InsertBillingPlan,
  type InsertSubscription,
  type InsertUser,
  type InsertUserEntitlement,
  type PlanQuota,
  type Subscription,
  type User,
  type UserEntitlement,
  type InsertJob,
  type Job,
  type ExportJob,
  type InsertExportJob,
  type ActivityLog,
  type InsertActivityLog,
  type Lead,
  type InsertLead,
  type LeadComment,
  type InsertLeadComment,
  type Ad,
  type InsertAd,
  type AdCreative,
  type AdReview,
  type InsertAdReview,
  adCreatives,
  type Service,
  type InsertService,
} from "@shared/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUserApproval(id: string, approved: boolean): Promise<User | null>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | null>;
  listJobs(filters?: {
    ownerId?: string;
    assigneeId?: string;
    status?: string | string[];
    region?: string | string[];
    country?: string | string[];
    trade?: string | string[];
  }): Promise<Job[]>;
  updateJob(
    id: string,
    updates: Partial<Pick<Job, "title" | "description" | "region" | "country" | "trade" | "updatedAt">>,
  ): Promise<Job | null>;
  setJobStatus(id: string, status: Job["status"]): Promise<Job | null>;
  assignJob(id: string, assigneeId: string | null, options?: { allowReassign?: boolean }): Promise<Job | null>;
  claimJob(id: string, assigneeId: string): Promise<Job | null>;
  addActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  listJobActivity(jobId: string): Promise<ActivityLog[]>;
  createAd(ad: InsertAd): Promise<Ad>;
  getAd(id: string): Promise<Ad | null>;
  listAds(filters?: { status?: string | string[] }): Promise<Ad[]>;
  listAdCreatives(adIds?: string[]): Promise<AdCreative[]>;
  updateAdStatus(id: string, status: Ad["status"], updatedBy: string): Promise<Ad | null>;
  createAdReview(review: InsertAdReview): Promise<AdReview>;
  listAdReviews(adId: string): Promise<AdReview[]>;
  listAdInsights(): Promise<AdInsightsRow[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  getLead(id: string, options?: { partnerId?: string }): Promise<Lead | null>;
  listLeads(filters?: {
    partnerId?: string;
    status?: string | string[];
    region?: string | string[];
    country?: string | string[];
  }): Promise<Lead[]>;
  updateLead(
    id: string,
    updates: Partial<
      Pick<
        Lead,
        "clientName" | "status" | "location" | "country" | "region" | "notes" | "files" | "updatedBy" | "updatedAt"
      >
    >,
    options?: { partnerId?: string },
  ): Promise<Lead | null>;
  deleteLead(id: string, options?: { partnerId?: string }): Promise<boolean>;
  addLeadComment(comment: InsertLeadComment): Promise<LeadComment>;
  listLeadComments(leadId: string, options?: { partnerId?: string }): Promise<LeadComment[]>;
  listLeadActivity(leadId: string, options?: { partnerId?: string }): Promise<ActivityLog[]>;
  createExportJob(exportJob: InsertExportJob): Promise<ExportJob>;
  getExportJob(id: string, options?: { createdBy?: string; tenantId?: string }): Promise<ExportJob | null>;
  listExportJobs(filters?: { createdBy?: string; tenantId?: string }): Promise<ExportJob[]>;
  updateExportJob(
    id: string,
    updates: Partial<Pick<ExportJob, "status" | "fileUrl" | "updatedAt">>,
  ): Promise<ExportJob | null>;
  listServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(
    id: string,
    updates: Partial<Pick<Service, "name" | "description" | "unit" | "basePrice" | "active">>,
  ): Promise<Service | null>;
}

export interface UserProfile {
  user: User;
  plan: BillingPlan;
  subscription: Subscription | null;
  entitlements: string[];
  quotas: PlanQuota;
  hasEntitlementsRecord?: boolean;
}

export type AdInsightsRow = {
  trade: string | null;
  region: string | null;
  count: number;
};

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

    return {
      user,
      subscription,
      plan,
      entitlements,
      quotas,
      hasEntitlementsRecord: Boolean(userEntitlementRecord),
    };
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [record] = await this.db.insert(jobs).values(job).returning();
    if (!record) {
      throw new Error("Failed to insert job");
    }
    return record;
  }

  async getJob(id: string): Promise<Job | null> {
    const record = await this.db.query.jobs.findFirst({
      where: eq(jobs.id, id),
    });
    return record ?? null;
  }

  async listJobs(filters: {
    ownerId?: string;
    assigneeId?: string;
    status?: string | string[];
    region?: string | string[];
    country?: string | string[];
    trade?: string | string[];
  } = {}): Promise<Job[]> {
    const conditions = [];

    if (filters.ownerId) {
      conditions.push(eq(jobs.ownerId, filters.ownerId));
    }

    if (filters.assigneeId) {
      conditions.push(eq(jobs.assigneeId, filters.assigneeId));
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      conditions.push(inArray(jobs.status, statuses));
    }

    if (filters.region) {
      const regions = Array.isArray(filters.region) ? filters.region : [filters.region];
      conditions.push(inArray(jobs.region, regions));
    }

    if (filters.country) {
      const countries = Array.isArray(filters.country) ? filters.country : [filters.country];
      conditions.push(inArray(jobs.country, countries));
    }

    if (filters.trade) {
      const trades = Array.isArray(filters.trade) ? filters.trade : [filters.trade];
      conditions.push(inArray(jobs.trade, trades));
    }

    const whereClause = conditions.reduce<SQL<unknown> | undefined>(
      (acc, condition) => (acc ? and(acc, condition) : condition),
      undefined,
    );

    const baseQuery = this.db.select().from(jobs);
    const filteredQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;
    return filteredQuery.orderBy(desc(jobs.updatedAt), desc(jobs.createdAt));
  }

  async updateJob(
    id: string,
    updates: Partial<Pick<Job, "title" | "description" | "privateDetails" | "region" | "country" | "trade" | "updatedAt">>,
  ): Promise<Job | null> {
    const [record] = await this.db
      .update(jobs)
      .set({ ...updates, updatedAt: updates.updatedAt ?? new Date() })
      .where(eq(jobs.id, id))
      .returning();

    return record ?? null;
  }

  async setJobStatus(id: string, status: Job["status"]): Promise<Job | null> {
    const [record] = await this.db
      .update(jobs)
      .set({ status, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return record ?? null;
  }

  async assignJob(id: string, assigneeId: string | null, options: { allowReassign?: boolean } = {}): Promise<Job | null> {
    const now = new Date();
    const condition = options.allowReassign ? eq(jobs.id, id) : and(eq(jobs.id, id), isNull(jobs.assigneeId));

    const [record] = await this.db
      .update(jobs)
      .set({ assigneeId, updatedAt: now })
      .where(condition)
      .returning();

    return record ?? null;
  }

  async claimJob(id: string, assigneeId: string): Promise<Job | null> {
    const now = new Date();

    return this.db.transaction(async (tx) => {
      const [assigned] = await tx
        .update(jobs)
        .set({ assigneeId, updatedAt: now })
        .where(and(eq(jobs.id, id), isNull(jobs.assigneeId)))
        .returning();

      if (!assigned) {
        return null;
      }

      const nextStatus = assigned.status === "open" ? "in_progress" : assigned.status;

      if (nextStatus === assigned.status) {
        return assigned;
      }

      const [statusUpdated] = await tx
        .update(jobs)
        .set({ status: nextStatus, updatedAt: now })
        .where(eq(jobs.id, id))
        .returning();

      return statusUpdated ?? { ...assigned, status: nextStatus, updatedAt: now };
    });
  }

  async addActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [record] = await this.db.insert(activityLogs).values(log).returning();
    if (!record) {
      throw new Error("Failed to insert activity log");
    }
    return record;
  }

  async listJobActivity(jobId: string): Promise<ActivityLog[]> {
    return this.db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.jobId, jobId))
      .orderBy(desc(activityLogs.timestamp));
  }

  async createAd(ad: InsertAd): Promise<Ad> {
    const [record] = await this.db.insert(schema.ads).values(ad).returning();
    if (!record) {
      throw new Error("Failed to insert ad");
    }
    return record;
  }

  async getAd(id: string): Promise<Ad | null> {
    const ad = await this.db.query.ads.findFirst({
      where: eq(schema.ads.id, id),
    });
    return ad ?? null;
  }

  async listAds(filters: { status?: string | string[] } = {}): Promise<Ad[]> {
    const conditions = [];
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      conditions.push(inArray(schema.ads.status, statuses));
    }
    const whereClause = conditions.reduce<SQL<unknown> | undefined>(
      (acc, condition) => (acc ? and(acc, condition) : condition),
      undefined,
    );
    const baseQuery = this.db.select().from(schema.ads);
    const filteredQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;
    return filteredQuery.orderBy(desc(schema.ads.updatedAt), desc(schema.ads.createdAt));
  }

  async listAdCreatives(adIds?: string[]): Promise<AdCreative[]> {
    const baseQuery = this.db.select().from(adCreatives);
    if (!adIds?.length) {
      return baseQuery.orderBy(desc(adCreatives.updatedAt), desc(adCreatives.createdAt));
    }
    return baseQuery
      .where(inArray(adCreatives.adId, adIds))
      .orderBy(desc(adCreatives.updatedAt), desc(adCreatives.createdAt));
  }

  async updateAdStatus(id: string, status: Ad["status"], updatedBy: string): Promise<Ad | null> {
    const [record] = await this.db
      .update(schema.ads)
      .set({ status, updatedBy, updatedAt: new Date() })
      .where(eq(schema.ads.id, id))
      .returning();
    return record ?? null;
  }

  async createAdReview(review: InsertAdReview): Promise<AdReview> {
    const [record] = await this.db.insert(schema.adReviews).values(review).returning();
    if (!record) {
      throw new Error("Failed to insert ad review");
    }
    return record;
  }

  async listAdReviews(adId: string): Promise<AdReview[]> {
    return this.db
      .select()
      .from(schema.adReviews)
      .where(eq(schema.adReviews.adId, adId))
      .orderBy(desc(schema.adReviews.createdAt));
  }

  async listAdInsights(): Promise<AdInsightsRow[]> {
    return this.db
      .select({
        trade: jobs.trade,
        region: jobs.region,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(jobs)
      .groupBy(jobs.trade, jobs.region);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [record] = await this.db.insert(leads).values(lead).returning();
    if (!record) {
      throw new Error("Failed to insert lead");
    }
    return record;
  }

  async getLead(id: string, options: { partnerId?: string } = {}): Promise<Lead | null> {
    const whereClause = options.partnerId ? and(eq(leads.id, id), eq(leads.partnerId, options.partnerId)) : eq(leads.id, id);
    const lead = await this.db.query.leads.findFirst({
      where: whereClause,
    });
    return lead ?? null;
  }

  async listLeads(filters: {
    partnerId?: string;
    status?: string | string[];
    region?: string | string[];
    country?: string | string[];
  } = {}): Promise<Lead[]> {
    const conditions = [];

    if (filters.partnerId) {
      conditions.push(eq(leads.partnerId, filters.partnerId));
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      conditions.push(inArray(leads.status, statuses));
    }

    if (filters.region) {
      const regions = Array.isArray(filters.region) ? filters.region : [filters.region];
      conditions.push(inArray(leads.region, regions));
    }

    if (filters.country) {
      const countries = Array.isArray(filters.country) ? filters.country : [filters.country];
      conditions.push(inArray(leads.country, countries));
    }

    const whereClause = conditions.reduce<SQL<unknown> | undefined>(
      (acc, condition) => (acc ? and(acc, condition) : condition),
      undefined,
    );

    const baseQuery = this.db.select().from(leads);
    const filteredQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;
    return filteredQuery.orderBy(desc(leads.updatedAt), desc(leads.createdAt));
  }

  async updateLead(
    id: string,
    updates: Partial<
      Pick<
        Lead,
        "clientName" | "status" | "location" | "country" | "region" | "notes" | "files" | "updatedBy" | "updatedAt"
      >
    >,
    options: { partnerId?: string } = {},
  ): Promise<Lead | null> {
    const conditions: SQL<unknown>[] = [eq(leads.id, id)];
    if (options.partnerId) {
      conditions.push(eq(leads.partnerId, options.partnerId));
    }
    const whereClause = conditions.reduce<SQL<unknown> | undefined>(
      (acc, condition) => (acc ? and(acc, condition) : condition),
      undefined,
    );
    const [record] = await this.db
      .update(leads)
      .set({ ...updates, updatedAt: updates.updatedAt ?? new Date() })
      .where(whereClause ?? eq(leads.id, id))
      .returning();

    return record ?? null;
  }

  async deleteLead(id: string, options: { partnerId?: string } = {}): Promise<boolean> {
    const conditions: SQL<unknown>[] = [eq(leads.id, id)];
    if (options.partnerId) {
      conditions.push(eq(leads.partnerId, options.partnerId));
    }
    const whereClause = conditions.reduce<SQL<unknown> | undefined>(
      (acc, condition) => (acc ? and(acc, condition) : condition),
      undefined,
    );
    const deleted = await this.db
      .delete(leads)
      .where(whereClause ?? eq(leads.id, id))
      .returning({ id: leads.id });
    return deleted.length > 0;
  }

  async addLeadComment(comment: InsertLeadComment): Promise<LeadComment> {
    const [record] = await this.db.insert(leadComments).values(comment).returning();
    if (!record) {
      throw new Error("Failed to insert comment");
    }
    return record;
  }

  async listLeadComments(leadId: string, options: { partnerId?: string } = {}): Promise<LeadComment[]> {
    const conditions: SQL<unknown>[] = [eq(leadComments.leadId, leadId)];
    if (options.partnerId) {
      conditions.push(eq(leads.partnerId, options.partnerId));
    }
    const whereClause = conditions.reduce<SQL<unknown> | undefined>(
      (acc, condition) => (acc ? and(acc, condition) : condition),
      undefined,
    );

    return this.db
      .select()
      .from(leadComments)
      .leftJoin(leads, eq(leadComments.leadId, leads.id))
      .where(whereClause ?? eq(leadComments.leadId, leadId))
      .orderBy(desc(leadComments.timestamp))
      .then((rows) => rows.map((row) => row.lead_comments).filter((comment): comment is LeadComment => Boolean(comment)));
  }

  async listLeadActivity(leadId: string, options: { partnerId?: string } = {}): Promise<ActivityLog[]> {
    const conditions: SQL<unknown>[] = [eq(activityLogs.leadId, leadId)];
    if (options.partnerId) {
      conditions.push(eq(leads.partnerId, options.partnerId));
    }
    const whereClause = conditions.reduce<SQL<unknown> | undefined>(
      (acc, condition) => (acc ? and(acc, condition) : condition),
      undefined,
    );

    return this.db
      .select()
      .from(activityLogs)
      .leftJoin(leads, eq(activityLogs.leadId, leads.id))
      .where(whereClause ?? eq(activityLogs.leadId, leadId))
      .orderBy(desc(activityLogs.timestamp))
      .then((rows) => rows.map((row) => row.activity_logs).filter((log): log is ActivityLog => Boolean(log)));
  }

  async createExportJob(exportJob: InsertExportJob): Promise<ExportJob> {
    const [record] = await this.db.insert(exportsTable).values(exportJob).returning();
    if (!record) {
      throw new Error("Failed to insert export job");
    }
    return record;
  }

  async getExportJob(id: string, options: { createdBy?: string; tenantId?: string } = {}): Promise<ExportJob | null> {
    const conditions: SQL<unknown>[] = [eq(exportsTable.id, id)];
    if (options.createdBy) {
      conditions.push(eq(exportsTable.createdBy, options.createdBy));
    }
    if (options.tenantId) {
      conditions.push(eq(exportsTable.tenantId, options.tenantId));
    }
    const whereClause = conditions.reduce<SQL<unknown> | undefined>(
      (acc, condition) => (acc ? and(acc, condition) : condition),
      undefined,
    );
    const record = await this.db.query.exportsTable.findFirst({
      where: whereClause ?? eq(exportsTable.id, id),
    });
    return record ?? null;
  }

  async listExportJobs(filters: { createdBy?: string; tenantId?: string } = {}): Promise<ExportJob[]> {
    const conditions: SQL<unknown>[] = [];
    if (filters.createdBy) {
      conditions.push(eq(exportsTable.createdBy, filters.createdBy));
    }
    if (filters.tenantId) {
      conditions.push(eq(exportsTable.tenantId, filters.tenantId));
    }
    const whereClause = conditions.reduce<SQL<unknown> | undefined>(
      (acc, condition) => (acc ? and(acc, condition) : condition),
      undefined,
    );
    const baseQuery = this.db.select().from(exportsTable);
    const filteredQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;
    return filteredQuery.orderBy(desc(exportsTable.createdAt));
  }

  async updateExportJob(
    id: string,
    updates: Partial<Pick<ExportJob, "status" | "fileUrl" | "updatedAt">>,
  ): Promise<ExportJob | null> {
    const [record] = await this.db
      .update(exportsTable)
      .set({ ...updates, updatedAt: updates.updatedAt ?? new Date() })
      .where(eq(exportsTable.id, id))
      .returning();
    return record ?? null;
  }

  async listServices(): Promise<Service[]> {
    return this.db.select().from(services).orderBy(desc(services.active), services.name);
  }

  async createService(service: InsertService): Promise<Service> {
    const [record] = await this.db.insert(services).values(service).returning();
    if (!record) {
      throw new Error("Failed to insert service");
    }
    return record;
  }

  async updateService(
    id: string,
    updates: Partial<Pick<Service, "name" | "description" | "unit" | "basePrice" | "active">>,
  ): Promise<Service | null> {
    const [record] = await this.db
      .update(services)
      .set(updates)
      .where(eq(services.id, id))
      .returning();
    return record ?? null;
  }
}
