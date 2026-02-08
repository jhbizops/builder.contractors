import { z } from "zod";
import type { Job, ActivityLog } from "@shared/schema";
import type { JobAttachment } from "@/types";
import { apiRequest } from "@/lib/queryClient";

const dateSchema = z
  .union([z.string(), z.date()])
  .transform((value) => (value instanceof Date ? value : new Date(value)));

const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  privateDetails: z.string().nullable(),
  status: z.string(),
  ownerId: z.string(),
  assigneeId: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  trade: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
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

export interface JobFilters {
  ownerId?: string;
  assigneeId?: string;
  status?: string | string[];
  region?: string | string[];
  country?: string | string[];
  trade?: string | string[];
}

export interface CreateJobActivityPayload {
  note: string;
  kind?: "comment" | "collaboration_request";
  attachments?: JobAttachment[];
}

export interface CreateJobPayload {
  title: string;
  description?: string;
  privateDetails?: string;
  region?: string;
  country?: string;
  trade: string;
}

export interface JobInvitePayload {
  emails: string[];
  message?: string;
}

const jobInviteSchema = z.object({
  jobId: z.string(),
  invited: z.array(z.string().email()),
  message: z.string().nullable(),
});

export const jobsKeyRoot = ["jobs"] as const;
export const jobsQueryKey = (filters: JobFilters = {}) => [...jobsKeyRoot, filters] as const;

function buildQuery(filters: JobFilters): string {
  const params = new URLSearchParams();

  const appendValue = (key: string, value?: string | string[]) => {
    if (!value) return;
    const values = Array.isArray(value) ? value : [value];
    if (values.length > 0) {
      params.append(key, values.join(","));
    }
  };

  appendValue("ownerId", filters.ownerId);
  appendValue("assigneeId", filters.assigneeId);
  appendValue("status", filters.status);
  appendValue("region", filters.region);
  appendValue("country", filters.country);
  appendValue("trade", filters.trade);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export async function fetchJobs(filters: JobFilters = {}): Promise<Job[]> {
  const res = await apiRequest("GET", `/api/jobs${buildQuery(filters)}`);
  const json = await res.json();
  const parsed = z.object({ jobs: z.array(jobSchema) }).parse(json);
  return parsed.jobs.map(mapJob);
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  const res = await apiRequest("POST", "/api/jobs", payload);
  const json = await res.json();
  const parsed = z.object({ job: jobSchema }).parse(json);
  return mapJob(parsed.job);
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<Job> {
  const res = await apiRequest("PATCH", `/api/jobs/${id}`, updates);
  const json = await res.json();
  const parsed = z.object({ job: jobSchema }).parse(json);
  return mapJob(parsed.job);
}

export async function setJobStatus(id: string, status: Job["status"]): Promise<Job> {
  const res = await apiRequest("PATCH", `/api/jobs/${id}/status`, { status });
  const json = await res.json();
  const parsed = z.object({ job: jobSchema }).parse(json);
  return mapJob(parsed.job);
}

export async function assignJob(id: string, assigneeId: string | null): Promise<Job> {
  const res = await apiRequest("POST", `/api/jobs/${id}/assign`, { assigneeId });
  const json = await res.json();
  const parsed = z.object({ job: jobSchema }).parse(json);
  return mapJob(parsed.job);
}

export async function claimJob(id: string): Promise<Job> {
  const res = await apiRequest("POST", `/api/jobs/${id}/claim`);
  const json = await res.json();
  const parsed = z.object({ job: jobSchema }).parse(json);
  return mapJob(parsed.job);
}

export async function inviteToJob(id: string, payload: JobInvitePayload) {
  const res = await apiRequest("POST", `/api/jobs/${id}/invite`, payload);
  const json = await res.json();
  const parsed = z.object({ invite: jobInviteSchema }).parse(json);
  return parsed.invite;
}

export async function fetchJobActivity(id: string): Promise<ActivityLog[]> {
  const res = await apiRequest("GET", `/api/jobs/${id}/activity`);
  const json = await res.json();
  const parsed = z.object({ activity: z.array(activitySchema) }).parse(json);
  return parsed.activity;
}

export async function createJobActivity(
  id: string,
  payload: CreateJobActivityPayload,
): Promise<ActivityLog> {
  const res = await apiRequest("POST", `/api/jobs/${id}/activity`, payload);
  const json = await res.json();
  const parsed = z.object({ activity: activitySchema }).parse(json);
  return parsed.activity;
}

function mapJob(job: z.infer<typeof jobSchema>): Job {
  return { ...job };
}
