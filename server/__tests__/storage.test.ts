import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@shared/schema";
import type { IStorage } from "../storage";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgres://user:pass@localhost:5432/test";

class InMemoryUserStorage implements IStorage {
  private users: schema.User[] = [];
  private jobs: schema.Job[] = [];

  async getUser(id: string) {
    return this.users.find((user) => user.id === id);
  }

  async getUserByEmail(email: string) {
    return this.users.find((user) => user.email === email);
  }

  async createUser(user: schema.InsertUser) {
    const record: schema.User = { ...user, createdAt: new Date(Date.now() + this.users.length) } as schema.User;
    this.users.push(record);
    return record;
  }

  async listUsers() {
    return [...this.users].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async updateUserApproval(id: string, approved: boolean) {
    const user = await this.getUser(id);
    if (!user) return null;
    user.approved = approved;
    return user;
  }

  // The job and activity methods are unused in these tests.
  // Implementations are provided to satisfy the interface and guard against accidental use.
  async createJob() {
    throw new Error("Not implemented");
  }

  async getJob() {
    throw new Error("Not implemented");
  }

  async listJobs() {
    return this.jobs;
  }

  async updateJob() {
    throw new Error("Not implemented");
  }

  async setJobStatus() {
    throw new Error("Not implemented");
  }

  async assignJob() {
    throw new Error("Not implemented");
  }

  async addActivityLog() {
    throw new Error("Not implemented");
  }

  async listJobActivity() {
    return [];
  }
}

describe("DatabaseStorage", () => {
  let storage: InMemoryUserStorage;

  beforeEach(async () => {
    storage = new InMemoryUserStorage();
  });

  it("creates and fetches users", async () => {
    const created = await storage.createUser({
      id: "user_1",
      email: "one@example.com",
      role: "sales",
      country: "US",
      region: null,
      locale: "en-US",
      currency: "USD",
      languages: ["en"],
      approved: false,
      passwordHash: "hash",
      passwordSalt: "salt",
    });

    expect(created.email).toBe("one@example.com");

    const fetched = await storage.getUser(created.id);
    expect(fetched?.email).toBe("one@example.com");

    const byEmail = await storage.getUserByEmail("one@example.com");
    expect(byEmail?.id).toBe(created.id);
  });

  it("lists users ordered by creation date", async () => {
    await storage.createUser({
      id: "user_1",
      email: "one@example.com",
      role: "sales",
      country: null,
      region: null,
      locale: null,
      currency: null,
      languages: [],
      approved: false,
      passwordHash: "hash1",
      passwordSalt: "salt1",
    });

    await storage.createUser({
      id: "user_2",
      email: "two@example.com",
      role: "builder",
      country: null,
      region: null,
      locale: null,
      currency: null,
      languages: [],
      approved: false,
      passwordHash: "hash2",
      passwordSalt: "salt2",
    });

    const users = await storage.listUsers();
    expect(users[0]?.email).toBe("two@example.com");
    expect(users[1]?.email).toBe("one@example.com");
  });

  it("updates user approval", async () => {
    await storage.createUser({
      id: "user_3",
      email: "three@example.com",
      role: "sales",
      country: null,
      region: null,
      locale: null,
      currency: null,
      languages: [],
      approved: false,
      passwordHash: "hash3",
      passwordSalt: "salt3",
    });

    const updated = await storage.updateUserApproval("user_3", true);
    expect(updated?.approved).toBe(true);

    const missing = await storage.updateUserApproval("unknown", true);
    expect(missing).toBeNull();
  });
});
