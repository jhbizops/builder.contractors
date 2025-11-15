import { desc, eq } from "drizzle-orm";
import { db as defaultDb } from "./db";
import * as schema from "@shared/schema";
import { users, type InsertUser, type User } from "@shared/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUserApproval(id: string, approved: boolean): Promise<User | null>;
}

export class DatabaseStorage implements IStorage {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async getUser(id: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(insertUser).returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }
    return user;
  }

  async listUsers(): Promise<User[]> {
    return this.db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserApproval(id: string, approved: boolean): Promise<User | null> {
    const [user] = await this.db
      .update(users)
      .set({ approved })
      .where(eq(users.id, id))
      .returning();

    return user ?? null;
  }
}

export const storage = new DatabaseStorage(defaultDb);
