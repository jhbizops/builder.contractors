import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch((error) => {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Validation failed",
          issues: error.flatten(),
        });
        return;
      }

      next(error);
    });
  };
}
