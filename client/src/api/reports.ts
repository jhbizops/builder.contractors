import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const exportFiltersSchema = z.discriminatedUnion("report", [
  z.object({
    report: z.literal("leads"),
    status: z.array(z.enum(["new", "in_progress", "completed", "on_hold"])).optional(),
    region: z.array(z.string()).optional(),
    country: z.array(z.string()).optional(),
  }),
  z.object({
    report: z.literal("jobs"),
    status: z.array(z.string()).optional(),
    region: z.array(z.string()).optional(),
    country: z.array(z.string()).optional(),
    trade: z.array(z.string()).optional(),
    ownerId: z.string().optional(),
    assigneeId: z.string().optional(),
  }),
]);

const exportJobSchema = z.object({
  id: z.string(),
  status: z.string(),
  filters: z.record(z.string(), z.unknown()).default({}),
  fileUrl: z.string().nullable().optional(),
  createdBy: z.string(),
  tenantId: z.string(),
  createdAt: z.union([z.string(), z.date()]).transform((value) => new Date(value)),
  updatedAt: z.union([z.string(), z.date()]).transform((value) => new Date(value)),
});

const createExportResponseSchema = z.object({
  export: exportJobSchema,
});

export type ExportFilters = z.infer<typeof exportFiltersSchema>;
export type ExportJob = z.infer<typeof exportJobSchema>;

export async function createExport(filters: ExportFilters): Promise<ExportJob> {
  const res = await apiRequest("POST", "/api/reports/exports", { filters });
  const json = await res.json();
  const parsed = createExportResponseSchema.parse(json);
  return parsed.export;
}
