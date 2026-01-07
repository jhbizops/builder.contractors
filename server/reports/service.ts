import { randomUUID } from "node:crypto";
import type { ExportJob, Job, Lead } from "@shared/schema";
import type { IStorage } from "../storage";
import { buildExportDownloadUrl, writeExportFile } from "./storage";
import type { ExportFilters } from "./validators";

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  approved: boolean;
};

type CsvRow = Record<string, string | number | null | undefined>;

function formatCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  const escaped = text.replace(/"/g, "\"\"");
  if (/[",\n]/.test(escaped)) {
    return `"${escaped}"`;
  }
  return escaped;
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toISOString();
}

function buildCsv(headers: string[], rows: CsvRow[]): string {
  const headerLine = headers.join(",");
  const rowLines = rows.map((row) => headers.map((key) => formatCsvValue(row[key])).join(","));
  return [headerLine, ...rowLines].join("\n");
}

function serializeLeads(leads: Lead[]): string {
  const headers = ["id", "clientName", "status", "location", "country", "region", "createdAt"];
  const rows: CsvRow[] = leads.map((lead) => ({
    id: lead.id,
    clientName: lead.clientName,
    status: lead.status,
    location: lead.location ?? "",
    country: lead.country ?? "",
    region: lead.region ?? "",
    createdAt: formatDate(lead.createdAt),
  }));
  return buildCsv(headers, rows);
}

function serializeJobs(jobs: Job[]): string {
  const headers = ["id", "title", "status", "ownerId", "assigneeId", "region", "country", "trade", "createdAt"];
  const rows: CsvRow[] = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    status: job.status,
    ownerId: job.ownerId,
    assigneeId: job.assigneeId ?? "",
    region: job.region ?? "",
    country: job.country ?? "",
    trade: job.trade ?? "",
    createdAt: formatDate(job.createdAt),
  }));
  return buildCsv(headers, rows);
}

async function buildExportPayload(storage: IStorage, filters: ExportFilters): Promise<string> {
  if (filters.report === "jobs") {
    const jobs = await storage.listJobs({
      ownerId: filters.ownerId,
      assigneeId: filters.assigneeId,
      status: filters.status,
      region: filters.region,
      country: filters.country,
      trade: filters.trade,
    });
    return serializeJobs(jobs);
  }

  const leads = await storage.listLeads({
    status: filters.status,
    region: filters.region,
    country: filters.country,
  });
  return serializeLeads(leads);
}

export async function createExportJob(options: {
  storage: IStorage;
  user: AuthenticatedUser;
  tenantId: string;
  filters: ExportFilters;
}): Promise<ExportJob> {
  const { storage, user, tenantId, filters } = options;
  const now = new Date();
  const id = `export_${randomUUID()}`;

  const exportJob = await storage.createExportJob({
    id,
    status: "processing",
    filters,
    fileUrl: null,
    createdBy: user.id,
    tenantId,
    createdAt: now,
    updatedAt: now,
  });

  try {
    const content = await buildExportPayload(storage, filters);
    await writeExportFile(id, content);
    const fileUrl = buildExportDownloadUrl(id);
    const completedAt = new Date();
    const updated = await storage.updateExportJob(id, {
      status: "completed",
      fileUrl,
      updatedAt: completedAt,
    });
    return updated ?? { ...exportJob, status: "completed", fileUrl, updatedAt: completedAt };
  } catch (error) {
    await storage.updateExportJob(id, { status: "failed", updatedAt: new Date() });
    throw error;
  }
}
