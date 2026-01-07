import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const REPORTS_DIR = path.join(os.tmpdir(), "elyment-reports");

export async function ensureReportsDir(): Promise<string> {
  await fs.mkdir(REPORTS_DIR, { recursive: true, mode: 0o700 });
  return REPORTS_DIR;
}

export function getExportFilePath(id: string, extension = "csv"): string {
  return path.join(REPORTS_DIR, `${id}.${extension}`);
}

export async function writeExportFile(id: string, content: string, extension = "csv"): Promise<string> {
  const dir = await ensureReportsDir();
  const filePath = path.join(dir, `${id}.${extension}`);
  await fs.writeFile(filePath, content, { encoding: "utf8", mode: 0o600 });
  return filePath;
}

export function buildExportDownloadUrl(id: string): string {
  return `/api/reports/exports/${id}/download`;
}
