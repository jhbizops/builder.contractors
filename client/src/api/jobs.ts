import { z } from "zod";
import type { Job, ActivityLog } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const dateSchema = z
  .union([z.string(), z.date()])
  .transform((value) => (value instanceof Date ? value : new Date(value)));

const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  ownerId: z.string(),
  assigneeId: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
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

export const jobsQueryKey = ["jobs"] as const;

export async function fetchJobs(): Promise<Job[]> {
  const res = await apiRequest("GET", "/api/jobs");
  const json = await res.json();
  const parsed = z.object({ jobs: z.array(jobSchema) }).parse(json);
  return parsed.jobs.map(mapJob);
}

export async function createJob(payload: Omit<Job, "id" | "createdAt" | "updatedAt">): Promise<Job> {
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

export async function fetchJobActivity(id: string): Promise<ActivityLog[]> {
  const res = await apiRequest("GET", `/api/jobs/${id}/activity`);
  const json = await res.json();
  const parsed = z.object({ activity: z.array(activitySchema) }).parse(json);
  return parsed.activity;
}

function mapJob(job: z.infer<typeof jobSchema>): Job {
  return {
    ...job,
    description: job.description ?? undefined,
    region: job.region ?? undefined,
    country: job.country ?? undefined,
  };
}
