import { randomUUID } from "node:crypto";
import {
  type User,
  type Lead,
  type LeadComment,
  type ActivityLog,
  type Service,
  type LeadFile,
} from "@shared/schema";

export interface StoredUser extends User {
  passwordHash: string;
  passwordSalt: string;
  passwordIterations: number;
}

export interface CreateUserInput {
  email: string;
  role: User["role"];
  passwordHash: string;
  passwordSalt: string;
  passwordIterations: number;
  country?: string;
  region?: string;
  approved?: boolean;
}

export interface UpdateUserInput {
  role?: User["role"];
  country?: string | null;
  region?: string | null;
  approved?: boolean;
}

export interface CreateLeadInput {
  partnerId: string;
  clientName: string;
  status: Lead["status"];
  location?: string | null;
  country?: string | null;
  region?: string | null;
  notes?: string[];
  files?: LeadFile[];
  createdBy: string;
  updatedBy?: string | null;
}

export interface UpdateLeadInput extends Partial<Omit<Lead, "id" | "partnerId" | "createdAt" | "createdBy">> {}

export interface CreateLeadCommentInput {
  leadId: string;
  body: string;
  author: string;
}

export interface CreateActivityLogInput {
  leadId?: string;
  action: string;
  performedBy: string;
}

export interface CreateServiceInput {
  name: string;
  description?: string | null;
  unit: string;
  basePrice: number;
  imageUrl?: string | null;
  active?: boolean;
}

export interface UpdateServiceInput extends Partial<Omit<Service, "id">> {}

export interface IStorage {
  getUser(id: string): Promise<StoredUser | undefined>;
  getUserByEmail(email: string): Promise<StoredUser | undefined>;
  listUsers(): Promise<StoredUser[]>;
  createUser(user: CreateUserInput): Promise<StoredUser>;
  updateUser(id: string, updates: UpdateUserInput): Promise<StoredUser>;

  listLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: CreateLeadInput): Promise<Lead>;
  updateLead(id: string, updates: UpdateLeadInput): Promise<Lead>;
  deleteLead(id: string): Promise<void>;

  listLeadComments(filter?: { leadId?: string }): Promise<LeadComment[]>;
  createLeadComment(input: CreateLeadCommentInput): Promise<LeadComment>;

  listActivityLogs(filter?: { leadId?: string }): Promise<ActivityLog[]>;
  createActivityLog(input: CreateActivityLogInput): Promise<ActivityLog>;

  listServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(input: CreateServiceInput): Promise<Service>;
  updateService(id: string, updates: UpdateServiceInput): Promise<Service>;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemStorage implements IStorage {
  private users = new Map<string, StoredUser>();
  private leads = new Map<string, Lead>();
  private leadComments = new Map<string, LeadComment>();
  private activityLogs = new Map<string, ActivityLog>();
  private services = new Map<string, Service>();

  async getUser(id: string): Promise<StoredUser | undefined> {
    const user = this.users.get(id);
    return user ? clone(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<StoredUser | undefined> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return clone(user);
      }
    }
    return undefined;
  }

  async listUsers(): Promise<StoredUser[]> {
    return Array.from(this.users.values()).map((user) => clone(user));
  }

  async createUser(input: CreateUserInput): Promise<StoredUser> {
    const id = randomUUID();
    const user: StoredUser = {
      id,
      email: input.email,
      role: input.role,
      country: input.country ?? undefined,
      region: input.region ?? undefined,
      approved: input.approved ?? false,
      createdAt: new Date(),
      passwordHash: input.passwordHash,
      passwordSalt: input.passwordSalt,
      passwordIterations: input.passwordIterations,
    };

    this.users.set(id, user);
    return clone(user);
  }

  async updateUser(id: string, updates: UpdateUserInput): Promise<StoredUser> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error("User not found");
    }

    const updated: StoredUser = {
      ...existing,
      ...updates,
    };

    this.users.set(id, updated);
    return clone(updated);
  }

  async listLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).map((lead) => clone(lead));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    return lead ? clone(lead) : undefined;
  }

  async createLead(input: CreateLeadInput): Promise<Lead> {
    const now = new Date();
    const lead: Lead = {
      id: randomUUID(),
      partnerId: input.partnerId,
      clientName: input.clientName,
      status: input.status,
      location: input.location ?? undefined,
      country: input.country ?? undefined,
      region: input.region ?? undefined,
      notes: input.notes ?? [],
      files: input.files ?? [],
      createdBy: input.createdBy,
      updatedBy: input.updatedBy ?? undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.leads.set(lead.id, lead);
    return clone(lead);
  }

  async updateLead(id: string, updates: UpdateLeadInput): Promise<Lead> {
    const existing = this.leads.get(id);
    if (!existing) {
      throw new Error("Lead not found");
    }

    const updated: Lead = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.leads.set(id, updated);
    return clone(updated);
  }

  async deleteLead(id: string): Promise<void> {
    this.leads.delete(id);
    for (const [commentId, comment] of this.leadComments.entries()) {
      if (comment.leadId === id) {
        this.leadComments.delete(commentId);
      }
    }
    for (const [logId, log] of this.activityLogs.entries()) {
      if (log.leadId === id) {
        this.activityLogs.delete(logId);
      }
    }
  }

  async listLeadComments(filter?: { leadId?: string }): Promise<LeadComment[]> {
    const { leadId } = filter ?? {};
    const comments = Array.from(this.leadComments.values()).filter((comment) =>
      leadId ? comment.leadId === leadId : true,
    );
    return comments.map((comment) => clone(comment));
  }

  async createLeadComment(input: CreateLeadCommentInput): Promise<LeadComment> {
    const comment: LeadComment = {
      id: randomUUID(),
      leadId: input.leadId,
      body: input.body,
      author: input.author,
      timestamp: new Date(),
    };

    this.leadComments.set(comment.id, comment);
    return clone(comment);
  }

  async listActivityLogs(filter?: { leadId?: string }): Promise<ActivityLog[]> {
    const { leadId } = filter ?? {};
    const logs = Array.from(this.activityLogs.values()).filter((log) =>
      leadId ? log.leadId === leadId : true,
    );
    return logs.map((log) => clone(log));
  }

  async createActivityLog(input: CreateActivityLogInput): Promise<ActivityLog> {
    const log: ActivityLog = {
      id: randomUUID(),
      leadId: input.leadId ?? undefined,
      action: input.action,
      performedBy: input.performedBy,
      timestamp: new Date(),
    };

    this.activityLogs.set(log.id, log);
    return clone(log);
  }

  async listServices(): Promise<Service[]> {
    return Array.from(this.services.values()).map((service) => clone(service));
  }

  async getService(id: string): Promise<Service | undefined> {
    const service = this.services.get(id);
    return service ? clone(service) : undefined;
  }

  async createService(input: CreateServiceInput): Promise<Service> {
    const service: Service = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? undefined,
      unit: input.unit,
      basePrice: input.basePrice,
      imageUrl: input.imageUrl ?? undefined,
      active: input.active ?? true,
    };

    this.services.set(service.id, service);
    return clone(service);
  }

  async updateService(id: string, updates: UpdateServiceInput): Promise<Service> {
    const existing = this.services.get(id);
    if (!existing) {
      throw new Error("Service not found");
    }

    const updated: Service = {
      ...existing,
      ...updates,
    };

    this.services.set(id, updated);
    return clone(updated);
  }
}

export const storage = new MemStorage();
