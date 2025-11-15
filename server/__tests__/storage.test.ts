import { beforeEach, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { DatabaseStorage } from "../storage";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

describe("DatabaseStorage", () => {
  let db: NodePgDatabase<typeof schema>;
  let storage: DatabaseStorage;

  beforeEach(async () => {
    const dbInstance = newDb({ autoCreateForeignKeyIndices: true });
    const adapter = dbInstance.adapters.createPg();
    const client = new adapter.Client();
    await client.connect();

    await client.query(
      `CREATE TABLE users (
        id text PRIMARY KEY,
        email text UNIQUE NOT NULL,
        role text NOT NULL,
        country text,
        region text,
        locale text,
        currency text,
        languages jsonb NOT NULL DEFAULT '[]'::jsonb,
        approved boolean DEFAULT false,
        password_hash text NOT NULL,
        password_salt text NOT NULL,
        created_at timestamp DEFAULT now()
      );`,
    );

    db = drizzle(client, { schema });
    storage = new DatabaseStorage(db);
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
