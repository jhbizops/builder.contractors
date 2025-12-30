import { z } from "zod";
import type { Lead, LeadComment, ActivityLog } from "@/types";
import { apiRequest } from "@/lib/queryClient";

const dateSchema = z
  .union([z.string(), z.date()])
  .transform((value) => (value instanceof Date ? value : new Date(value)));

const leadFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number(),
  dataUrl: z.string(),
  uploadedAt: dateSchema,
});

const leadSchema = z.object({
  id: z.string(),
  partnerId: z.string(),
  clientName: z.string(),
  status: z.enum(["new", "in_progress", "completed", "on_hold"]),
  location: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  notes: z.array(z.string()).default([]),
  files: z.array(leadFileSchema).default([]),
  createdBy: z.string(),
  updatedBy: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

const commentSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  body: z.string(),
  author: z.string(),
  timestamp: dateSchema,
});

const activitySchema = z.object({
  id: z.string(),
  leadId: z.string().nullable(),
  jobId: z.string().nullable(),
  action: z.string(),
  performedBy: z.string(),
  details: z.record(z.string(), z.unknown()).default({}),
  timestamp: dateSchema,
});

export const leadsQueryKey = ["leads"] as const;

export async function fetchLeads(): Promise<Lead[]> {
  const res = await apiRequest("GET", "/api/leads");
  const json = await res.json();
  const parsed = z.object({ leads: z.array(leadSchema) }).parse(json);
  return parsed.leads;
}

export async function createLead(payload: Omit<Lead, "id">): Promise<Lead> {
  const res = await apiRequest("POST", "/api/leads", payload);
  const json = await res.json();
  const parsed = z.object({ lead: leadSchema }).parse(json);
  return parsed.lead;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const res = await apiRequest("PATCH", `/api/leads/${id}`, updates);
  const json = await res.json();
  const parsed = z.object({ lead: leadSchema }).parse(json);
  return parsed.lead;
}

export async function deleteLead(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/leads/${id}`);
}

export async function fetchLeadComments(leadId: string): Promise<LeadComment[]> {
  const res = await apiRequest("GET", `/api/leads/${leadId}/comments`);
  const json = await res.json();
  const parsed = z.object({ comments: z.array(commentSchema) }).parse(json);
  return parsed.comments;
}

export async function addLeadComment(leadId: string, body: string): Promise<LeadComment> {
  const res = await apiRequest("POST", `/api/leads/${leadId}/comments`, { body });
  const json = await res.json();
  const parsed = z.object({ comment: commentSchema }).parse(json);
  return parsed.comment;
}

export async function fetchLeadActivity(leadId: string): Promise<ActivityLog[]> {
  const res = await apiRequest("GET", `/api/leads/${leadId}/activity`);
  const json = await res.json();
  const parsed = z.object({ activity: z.array(activitySchema) }).parse(json);
  return parsed.activity;
}

export async function addLeadActivity(leadId: string, action: string, details: Record<string, unknown> = {}) {
  const res = await apiRequest("POST", `/api/leads/${leadId}/activity`, { action, details });
  const json = await res.json();
  const parsed = z.object({ log: activitySchema }).parse(json);
  return parsed.log;
}
