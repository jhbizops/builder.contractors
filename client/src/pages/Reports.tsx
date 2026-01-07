import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  createExportJob,
  exportJobsQueryKey,
  fetchExportJobs,
} from "@/api/reports";
import type { ExportJob, ExportJobStatus } from "@/types";

const dateInputSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => value?.trim() ?? "")
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), {
    message: "Enter a valid date.",
  });

const reportFormSchema = z
  .object({
    startDate: dateInputSchema,
    endDate: dateInputSchema,
    reportType: z.enum(["leads", "services", "jobs"]),
  })
  .superRefine((value, ctx) => {
    if (value.reportType === "services") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reportType"],
        message: "Services exports are not available yet.",
      });
    }

    if (value.startDate && value.endDate) {
      const start = new Date(value.startDate);
      const end = new Date(value.endDate);
      if (start > end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "End date must be on or after the start date.",
        });
      }
    }
  });

type ReportFormValues = z.infer<typeof reportFormSchema>;

const statusLabels: Record<ExportJobStatus, string> = {
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

const statusVariants: Record<ExportJobStatus, "default" | "secondary" | "destructive" | "outline"> = {
  queued: "secondary",
  processing: "outline",
  completed: "default",
  failed: "destructive",
};

function getReportTypeLabel(filters: Record<string, unknown>): string {
  const report = typeof filters.report === "string" ? filters.report : "unknown";
  if (report === "leads") return "Leads";
  if (report === "jobs") return "Jobs";
  if (report === "services") return "Services";
  return "Unknown";
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const {
    data: exports = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: exportJobsQueryKey,
    queryFn: fetchExportJobs,
  });

  const mutation = useMutation({
    mutationFn: (filters: Record<string, unknown>) => createExportJob(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exportJobsQueryKey });
      toast({
        title: "Export started",
        description: "Your export is being generated. We'll update the list when it's ready.",
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to generate export.";
      toast({
        title: "Export failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, isValid },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    mode: "onChange",
    defaultValues: {
      startDate: "",
      endDate: "",
      reportType: "leads",
    },
  });

  useEffect(() => {
    void trigger();
  }, [trigger]);

  const onSubmit = (values: ReportFormValues) => {
    const filters =
      values.reportType === "jobs" ? { report: "jobs" } : { report: "leads" };
    mutation.mutate(filters);
  };

  return (
    <ProtectedRoute requiredEntitlement="reports.export">
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Premium reports</h1>
            <p className="text-slate-600">Exports and analytics are included with paid plans.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Generate export</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start date</Label>
                    <Controller
                      control={control}
                      name="startDate"
                      render={({ field }) => (
                        <Input id="startDate" type="date" {...field} />
                      )}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">{errors.startDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End date</Label>
                    <Controller
                      control={control}
                      name="endDate"
                      render={({ field }) => (
                        <Input id="endDate" type="date" {...field} />
                      )}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportType">Entity type</Label>
                    <Controller
                      control={control}
                      name="reportType"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="reportType">
                            <SelectValue placeholder="Select entity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="leads">Leads</SelectItem>
                            <SelectItem value="services">Services</SelectItem>
                            <SelectItem value="jobs">Jobs</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.reportType && (
                      <p className="text-sm text-red-500">{errors.reportType.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Export jobs will appear below once they are queued.
                  </p>
                  <Button type="submit" disabled={!isValid || mutation.isPending}>
                    {mutation.isPending ? "Generating…" : "Generate export"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Export jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-slate-500">Loading exports…</p>
              ) : isError ? (
                <p className="text-sm text-red-500">Unable to load export jobs.</p>
              ) : exports.length === 0 ? (
                <p className="text-sm text-slate-500">No exports yet. Generate one to get started.</p>
              ) : (
                <div className="space-y-3">
                  {exports.map((job: ExportJob) => (
                    <div
                      key={job.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">{job.id}</p>
                        <p className="text-xs text-slate-500">
                          {getReportTypeLabel(job.filters)} export · Requested {job.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariants[job.status]}>{statusLabels[job.status]}</Badge>
                        {job.status === "completed" && job.fileUrl ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={job.fileUrl} download>
                              Download
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
