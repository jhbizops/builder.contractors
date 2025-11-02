import type { StoredUser } from "../storage";

declare module "express-serve-static-core" {
  interface Request {
    currentUser?: StoredUser;
  }
}
