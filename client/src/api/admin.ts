import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const metricsSchema = z.object({
  totalUsers: z.number(),
  activeLeads: z.number(),
  pendingApprovals: z.number(),
  monthlyRevenue: z.number(),
});

const metricsResponseSchema = z.object({
  metrics: metricsSchema,
});

export type AdminMetrics = z.infer<typeof metricsSchema>;

export const adminMetricsQueryKey = ["admin", "metrics"] as const;

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const res = await apiRequest("GET", "/api/admin/metrics");
  const json = await res.json();
  const parsed = metricsResponseSchema.parse(json);
  return parsed.metrics;
}
