import express from "express";
import session from "express-session";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "../../session";
import type { User } from "@shared/schema";
import type { IStorage } from "../../storage";

vi.mock("../../storage", async () => {
  const actual = await vi.importActual<typeof import("../../storage")>("../../storage");
  const store = new Map<string, User>();

  const storage: IStorage = {
    async getUser(id: string) {
      return store.get(id);
    },
    async getUserByEmail(email: string) {
      for (const user of store.values()) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          return user;
        }
      }
      return undefined;
    },
    async createUser(user) {
      const next: User = {
        ...user,
        createdAt: user.createdAt ?? new Date(),
      };
      store.set(next.id, next);
      return next;
    },
    async listUsers() {
      return Array.from(store.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    },
    async updateUserApproval(id: string, approved: boolean) {
      const existing = store.get(id);
      if (!existing) {
        return null;
      }
      const updated: User = { ...existing, approved };
      store.set(id, updated);
      return updated;
    },
  };

  return {
    ...actual,
    storage,
    __resetMockStorage: () => store.clear(),
  };
});

const createApp = () => {
  const app = express();
  const MemoryStore = session.MemoryStore;
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore(),
      name: SESSION_COOKIE_NAME,
    }),
  );
  app.use(express.json());
  return app;
};

describe("auth and users routes", () => {
  let app: express.Express;
  let resetStorage: () => void;

  beforeEach(async () => {
    const storageModule = (await import("../../storage")) as unknown as {
      __resetMockStorage: () => void;
    };
    resetStorage = storageModule.__resetMockStorage;
    resetStorage();
    app = createApp();
    const { authRouter } = await import("../../auth/routes");
    const { usersRouter } = await import("../../users/routes");
    app.use("/api/auth", authRouter);
    app.use("/api/users", usersRouter);
  });

  it("registers, logs out, and logs in a user", async () => {
    const agent = request.agent(app);

    const registerRes = await agent
      .post("/api/auth/register")
      .send({ email: "tester@example.com", password: "Password123!", role: "sales" })
      .expect(201);

    expect(registerRes.body.user.email).toBe("tester@example.com");

    await agent.get("/api/auth/me").expect(200);

    await agent.post("/api/auth/logout").expect(204);
    await agent.get("/api/auth/me").expect(401);

    await agent
      .post("/api/auth/login")
      .send({ email: "tester@example.com", password: "Password123!" })
      .expect(200);

    await agent
      .post("/api/auth/login")
      .send({ email: "tester@example.com", password: "WrongPassword" })
      .expect(401);
  });

  it("allows admins to list and approve users", async () => {
    const adminAgent = request.agent(app);
    await adminAgent
      .post("/api/auth/register")
      .send({ email: "admin@example.com", password: "AdminPass123!", role: "admin" })
      .expect(201);

    const userAgent = request.agent(app);
    const userRes = await userAgent
      .post("/api/auth/register")
      .send({ email: "user@example.com", password: "UserPass123!", role: "sales" })
      .expect(201);

    const userId = userRes.body.user.id as string;

    const listRes = await adminAgent.get("/api/users").expect(200);
    expect(listRes.body.users).toHaveLength(2);

    const approvalRes = await adminAgent
      .patch(`/api/users/${userId}/approval`)
      .send({ approved: true })
      .expect(200);

    expect(approvalRes.body.user.approved).toBe(true);
    expect(approvalRes.body.user).not.toHaveProperty("passwordHash");
    expect(approvalRes.body.user).not.toHaveProperty("passwordSalt");

    await userAgent.get("/api/users").expect(403);
  });
});
