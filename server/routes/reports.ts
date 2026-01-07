import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storageInstance";
import { createExportJob } from "../reports/service";
import { buildExportDownloadUrl, getExportFilePath } from "../reports/storage";
import { createExportRequestSchema } from "../reports/validators";
import { promises as fs } from "node:fs";

const reportsRouter = Router();

const REPORTS_ENTITLEMENT = "reports_exports";

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  approved: boolean;
};

function getUser(res: Response): AuthenticatedUser {
  const user = res.locals.authenticatedUser as AuthenticatedUser | undefined;
  if (!user) {
    throw new Error("Authenticated user missing");
  }
  return user;
}

function isAdmin(role: string | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

function requireApproval(user: AuthenticatedUser): boolean {
  return user.approved || isAdmin(user.role);
}

function ensureApproved(user: AuthenticatedUser, res: Response, message: string): boolean {
  if (!requireApproval(user)) {
    res.status(403).json({ message });
    return false;
  }
  return true;
}

async function ensureEntitled(user: AuthenticatedUser, res: Response): Promise<boolean> {
  if (isAdmin(user.role)) {
    return true;
  }
  const profile = await storage.getUserProfile(user.id);
  if (!profile) {
    res.status(403).json({ message: "Entitlements not available" });
    return false;
  }
  if (!profile.entitlements.includes(REPORTS_ENTITLEMENT)) {
    res.status(403).json({ message: "Report exports are not enabled" });
    return false;
  }
  return true;
}

function resolveTenantId(user: AuthenticatedUser): string {
  return user.id;
}

async function getAuthorizedExport(id: string, user: AuthenticatedUser, res: Response) {
  const tenantId = resolveTenantId(user);
  const scoped = await storage.getExportJob(id, {
    tenantId,
    createdBy: isAdmin(user.role) ? undefined : user.id,
  });
  if (scoped) return scoped;

  const existing = await storage.getExportJob(id);
  if (existing) {
    res.status(403).json({ message: "Forbidden" });
    return null;
  }

  res.status(404).json({ message: "Export job not found" });
  return null;
}

reportsRouter.use(requireAuth);

reportsRouter.post("/exports", async (req, res, next) => {
  try {
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to export reports")) return;
    if (!(await ensureEntitled(user, res))) return;

    const payload = createExportRequestSchema.parse(req.body);
    const exportJob = await createExportJob({
      storage,
      user,
      tenantId: resolveTenantId(user),
      filters: payload.filters,
    });
    res.status(201).json({ export: exportJob });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

reportsRouter.get("/exports", async (_req, res, next) => {
  try {
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to access exports")) return;
    if (!(await ensureEntitled(user, res))) return;

    const tenantId = resolveTenantId(user);
    const exportJobs = await storage.listExportJobs({
      tenantId,
      createdBy: isAdmin(user.role) ? undefined : user.id,
    });
    res.json({ exports: exportJobs });
  } catch (error) {
    next(error);
  }
});

reportsRouter.get("/exports/:id", async (req, res, next) => {
  try {
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to access exports")) return;
    if (!(await ensureEntitled(user, res))) return;
    const exportJob = await getAuthorizedExport(req.params.id, user, res);
    if (!exportJob) return;

    const fileUrl =
      exportJob.status === "completed" ? exportJob.fileUrl ?? buildExportDownloadUrl(exportJob.id) : null;
    res.json({ export: { ...exportJob, fileUrl } });
  } catch (error) {
    next(error);
  }
});

reportsRouter.get("/exports/:id/download", async (req, res, next) => {
  try {
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to access exports")) return;
    if (!(await ensureEntitled(user, res))) return;
    const exportJob = await getAuthorizedExport(req.params.id, user, res);
    if (!exportJob) return;

    if (exportJob.status !== "completed") {
      res.status(409).json({ message: "Export is not ready" });
      return;
    }

    const filePath = getExportFilePath(exportJob.id);
    await fs.access(filePath);
    res.download(filePath, `${exportJob.id}.csv`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      res.status(404).json({ message: "Export file not found" });
      return;
    }
    next(error);
  }
});

export { reportsRouter };
