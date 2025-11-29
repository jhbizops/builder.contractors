import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";
import { storage } from "../storageInstance";
import { toPublicUser } from "./serializers";
import { billingService } from "../billing/instance";

const usersRouter = Router();

usersRouter.use(requireAdmin);

usersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await storage.listUsers();
    const profiles = await Promise.all(
      users.map((user) => billingService.getUserBilling(user.id)),
    );
    const sanitized = profiles.filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
    res.json({ users: sanitized.map(toPublicUser) });
  } catch (error) {
    next(error);
  }
});

const approvalSchema = z.object({
  approved: z.boolean(),
});

usersRouter.patch("/:id/approval", async (req, res, next) => {
  try {
    const { approved } = approvalSchema.parse(req.body);
    const updated = await storage.updateUserApproval(req.params.id, approved);

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const profile = await billingService.getUserBilling(updated.id);

    if (!profile) {
      res.status(500).json({ message: "Unable to build user profile" });
      return;
    }

    res.json({ user: toPublicUser(profile) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

export { usersRouter };
