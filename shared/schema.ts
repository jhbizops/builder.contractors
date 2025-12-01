import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 'sales', 'builder', 'admin', 'super_admin', 'dual'
  country: text("country"), // User's country for regional filtering
  region: text("region"), // Auto-populated based on country
  locale: text("locale"),
  currency: text("currency"),
  languages: jsonb("languages").$type<string[]>().default([]).notNull(),
  approved: boolean("approved").default(false),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

const planQuotaSchema = z.object({
  seats: z.number().int().nonnegative(),
  leads: z.number().int().nonnegative(),
  storageGb: z.number().int().nonnegative().optional(),
  workspaces: z.number().int().nonnegative().optional(),
});

export type PlanQuota = z.infer<typeof planQuotaSchema>;

export const billingPlans = pgTable("billing_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  interval: text("interval").notNull().default("month"),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  entitlements: jsonb("entitlements").$type<string[]>().default([]).notNull(),
  quotas: jsonb("quotas").$type<PlanQuota>().notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  providerPriceId: text("provider_price_id"),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  planId: text("plan_id").notNull(),
  status: text("status").notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  provider: text("provider").notNull().default("stripe"),
  providerCustomerId: text("provider_customer_id"),
  providerSubscriptionId: text("provider_subscription_id"),
  metadata: jsonb("metadata").$type<Record<string, string>>().default({}),
});

export const userEntitlements = pgTable("user_entitlements", {
  userId: text("user_id").primaryKey(),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  quotas: jsonb("quotas").$type<PlanQuota>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const countries = pgTable("countries", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  langs: jsonb("langs").$type<string[]>().notNull(),
  currency: text("currency").notNull(),
  localize: boolean("localize").default(false).notNull(),
  proficiency: text("proficiency").notNull(),
});

// Leads table
export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  clientName: text("client_name").notNull(),
  status: text("status").notNull().default("new"), // 'new', 'in_progress', 'completed', 'on_hold'
  location: text("location"),
  country: text("country"), // Lead's country
  region: text("region"), // Auto-populated based on country
  notes: jsonb("notes").$type<string[]>().default([]),
  files: jsonb("files").$type<string[]>().default([]),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead comments table
export const leadComments = pgTable("lead_comments", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  body: text("body").notNull(),
  author: text("author").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").notNull(), // 'project', 'sq_ft', 'hour'
  basePrice: integer("base_price").notNull(),
  imageUrl: text("image_url"),
  active: boolean("active").default(true),
});

// Custom pricing table
export const customPricing = pgTable("custom_pricing", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  serviceId: text("service_id").notNull(),
  price: integer("price").notNull(),
  notes: text("notes"),
});

// Activity logs table
export const activityLogs = pgTable("activity_logs", {
  id: text("id").primaryKey(),
  leadId: text("lead_id"),
  action: text("action").notNull(),
  performedBy: text("performed_by").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCountrySchema = createInsertSchema(countries);

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadCommentSchema = createInsertSchema(leadComments).omit({
  id: true,
  timestamp: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertCustomPricingSchema = createInsertSchema(customPricing).omit({
  id: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export const insertBillingPlanSchema = createInsertSchema(billingPlans);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertUserEntitlementSchema = createInsertSchema(userEntitlements);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type LeadComment = typeof leadComments.$inferSelect;
export type InsertLeadComment = z.infer<typeof insertLeadCommentSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type CustomPricing = typeof customPricing.$inferSelect;
export type InsertCustomPricing = z.infer<typeof insertCustomPricingSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type BillingPlan = typeof billingPlans.$inferSelect;
export type InsertBillingPlan = z.infer<typeof insertBillingPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UserEntitlement = typeof userEntitlements.$inferSelect;
export type InsertUserEntitlement = z.infer<typeof insertUserEntitlementSchema>;
