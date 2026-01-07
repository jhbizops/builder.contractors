import { z } from "zod";
import { jobStatusEnum } from "@shared/schema";

const leadStatusEnum = z.enum(["new", "in_progress", "completed", "on_hold"]);

const leadFiltersSchema = z.object({
  report: z.literal("leads"),
  status: z.array(leadStatusEnum).optional(),
  region: z.array(z.string().min(1)).optional(),
  country: z.array(z.string().min(1)).optional(),
});

const jobFiltersSchema = z.object({
  report: z.literal("jobs"),
  status: z.array(jobStatusEnum).optional(),
  region: z.array(z.string().min(1)).optional(),
  country: z.array(z.string().min(1)).optional(),
  trade: z.array(z.string().min(1)).optional(),
  ownerId: z.string().min(1).optional(),
  assigneeId: z.string().min(1).optional(),
});

export const exportFiltersSchema = z.discriminatedUnion("report", [leadFiltersSchema, jobFiltersSchema]);

export const createExportRequestSchema = z.object({
  filters: exportFiltersSchema,
});

export type ExportFilters = z.infer<typeof exportFiltersSchema>;
