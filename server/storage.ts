import { randomUUID } from "node:crypto";

export type UserRole = "sales" | "builder" | "admin" | "dual";

export interface StoredUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly country?: string | null;
  readonly region?: string | null;
  readonly approved: boolean;
  readonly createdAt: Date;
}

export interface CreateUserInput {
  readonly id?: string;
  readonly email: string;
  readonly role: UserRole;
  readonly country?: string | null;
  readonly region?: string | null;
  readonly approved?: boolean;
  readonly createdAt?: Date;
}

export type LeadStatus = "new" | "in_progress" | "completed" | "on_hold";

export interface StoredLead {
  readonly id: string;
  readonly partnerId: string;
  readonly clientName: string;
  readonly status: LeadStatus;
  readonly location?: string | null;
  readonly country?: string | null;
  readonly region?: string | null;
  readonly notes: string[];
  readonly files: string[];
  readonly createdBy: string;
  readonly updatedBy?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly estimatedValue?: number | null;
  readonly serviceId?: string | null;
}

export interface CreateLeadInput {
  readonly id?: string;
  readonly partnerId: string;
  readonly clientName: string;
  readonly status?: LeadStatus;
  readonly location?: string | null;
  readonly country?: string | null;
  readonly region?: string | null;
  readonly notes?: string[];
  readonly files?: string[];
  readonly createdBy: string;
  readonly updatedBy?: string | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly estimatedValue?: number | null;
  readonly serviceId?: string | null;
}

export interface StoredService {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly unit: string;
  readonly basePrice: number;
  readonly imageUrl?: string | null;
  readonly active: boolean;
}

export interface CreateServiceInput {
  readonly id?: string;
  readonly name: string;
  readonly description?: string | null;
  readonly unit: string;
  readonly basePrice: number;
  readonly imageUrl?: string | null;
  readonly active?: boolean;
}

interface HttpError extends Error {
  status: number;
}

function createHttpError(status: number, message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.status = status;
  return error;
}

export interface IStorage {
  getUser(id: string): Promise<StoredUser | undefined>;
  getUserByEmail(email: string): Promise<StoredUser | undefined>;
  createUser(user: CreateUserInput): Promise<StoredUser>;
  listUsers(): Promise<StoredUser[]>;

  createLead(lead: CreateLeadInput): Promise<StoredLead>;
  listLeads(): Promise<StoredLead[]>;
  deleteLead(id: string): Promise<void>;

  createService(service: CreateServiceInput): Promise<StoredService>;
  listServices(): Promise<StoredService[]>;
}

export class MemStorage implements IStorage {
  private readonly users = new Map<string, StoredUser>();
  private readonly leads = new Map<string, StoredLead>();
  private readonly services = new Map<string, StoredService>();

  private currentUserSequence = 1;

  async getUser(id: string): Promise<StoredUser | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<StoredUser | undefined> {
    const normalised = email.trim().toLowerCase();
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === normalised,
    );
  }

  async createUser(input: CreateUserInput): Promise<StoredUser> {
    const id = input.id ?? `user_${this.currentUserSequence++}`;
    const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();

    const user: StoredUser = {
      id,
      email: input.email.trim(),
      role: input.role,
      country: input.country ?? null,
      region: input.region ?? null,
      approved: input.approved ?? false,
      createdAt,
    };

    this.users.set(id, user);
    return user;
  }

  async listUsers(): Promise<StoredUser[]> {
    return Array.from(this.users.values()).map((user) => ({ ...user }));
  }

  async createLead(input: CreateLeadInput): Promise<StoredLead> {
    const id = input.id ?? `lead_${randomUUID()}`;
    const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();
    const updatedAt = input.updatedAt ? new Date(input.updatedAt) : createdAt;

    const lead: StoredLead = {
      id,
      partnerId: input.partnerId,
      clientName: input.clientName,
      status: input.status ?? "new",
      location: input.location ?? null,
      country: input.country ?? null,
      region: input.region ?? null,
      notes: Array.isArray(input.notes) ? [...input.notes] : [],
      files: Array.isArray(input.files) ? [...input.files] : [],
      createdBy: input.createdBy,
      updatedBy: input.updatedBy ?? null,
      createdAt,
      updatedAt,
      estimatedValue: input.estimatedValue ?? null,
      serviceId: input.serviceId ?? null,
    };

    this.leads.set(id, lead);
    return lead;
  }

  async listLeads(): Promise<StoredLead[]> {
    return Array.from(this.leads.values()).map((lead) => ({
      ...lead,
      notes: [...lead.notes],
      files: [...lead.files],
    }));
  }

  async deleteLead(id: string): Promise<void> {
    const existed = this.leads.delete(id);
    if (!existed) {
      throw createHttpError(404, "Lead not found");
    }
  }

  async createService(input: CreateServiceInput): Promise<StoredService> {
    const id = input.id ?? `service_${randomUUID()}`;

    const service: StoredService = {
      id,
      name: input.name,
      description: input.description ?? null,
      unit: input.unit,
      basePrice: input.basePrice,
      imageUrl: input.imageUrl ?? null,
      active: input.active ?? true,
    };

    this.services.set(id, service);
    return service;
  }

  async listServices(): Promise<StoredService[]> {
    return Array.from(this.services.values()).map((service) => ({ ...service }));
  }
}

export const storage = new MemStorage();
