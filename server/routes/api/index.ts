import { Router } from "express";
import { leadsRouter } from "./leads";
import { leadCommentsRouter } from "./leadComments";
import { servicesRouter } from "./services";
import { activityLogsRouter } from "./activityLogs";

export function createApiRouter() {
  const router = Router();

  router.use(leadsRouter);
  router.use(leadCommentsRouter);
  router.use(servicesRouter);
  router.use(activityLogsRouter);

  return router;
}
