import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";
import { storage } from "../storage";
import { toPublicUser } from "./serializers";

const usersRouter = Router();

usersRouter.use(requireAdmin);

usersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await storage.listUsers();
    res.json({ users: users.map(toPublicUser) });
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

    res.json({ user: toPublicUser(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

export { usersRouter };
