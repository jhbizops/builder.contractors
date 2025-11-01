import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 'sales', 'builder', 'admin', 'dual'
  country: text("country"), // User's country for regional filtering
  region: text("region"), // Auto-populated based on country
  approved: boolean("approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
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
