import { z } from "zod";
import type { ExportJob } from "@/types";
import { apiRequest } from "@/lib/queryClient";

const dateSchema = z
  .union([z.string(), z.date()])
  .transform((value) => (value instanceof Date ? value : new Date(value)));

const exportStatusSchema = z.enum(["queued", "processing", "completed", "failed"]);

const exportJobSchema = z.object({
  id: z.string(),
  status: exportStatusSchema,
  filters: z.record(z.string(), z.unknown()).default({}),
  fileUrl: z.string().nullable().optional(),
  createdBy: z.string(),
  tenantId: z.string(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const exportJobsQueryKey = ["reports", "exports"] as const;

export async function fetchExportJobs(): Promise<ExportJob[]> {
  const res = await apiRequest("GET", "/api/reports/exports");
  const json = await res.json();
  const parsed = z.object({ exports: z.array(exportJobSchema) }).parse(json);
  return parsed.exports;
}

export async function fetchExportJob(id: string): Promise<ExportJob> {
  const res = await apiRequest("GET", `/api/reports/exports/${id}`);
  const json = await res.json();
  const parsed = z.object({ export: exportJobSchema }).parse(json);
  return parsed.export;
}

export async function createExportJob(filters: Record<string, unknown>): Promise<ExportJob> {
  const res = await apiRequest("POST", "/api/reports/exports", { filters });
  const json = await res.json();
  const parsed = z.object({ export: exportJobSchema }).parse(json);
  return parsed.export;
}
