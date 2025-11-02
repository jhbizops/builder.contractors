import { beforeEach, describe, expect, it } from 'vitest';
import {
  MemStorage,
  type CreateLeadInput,
  type CreateServiceInput,
} from '../storage';

let storage: MemStorage;

describe('MemStorage', () => {
  beforeEach(() => {
    storage = new MemStorage();
  });

  it('creates and updates users', async () => {
    const user = await storage.createUser({
      email: 'user@example.com',
      role: 'sales',
      passwordHash: 'hash',
      passwordSalt: 'salt',
      passwordIterations: 1000,
      approved: false,
    });

    expect(user.id).toBeTruthy();
    expect(user.approved).toBe(false);

    const updated = await storage.updateUser(user.id, { approved: true });
    expect(updated.approved).toBe(true);

    const fetched = await storage.getUser(user.id);
    expect(fetched?.email).toBe('user@example.com');

    const listed = await storage.listUsers();
    expect(listed).toHaveLength(1);
  });

  it('handles lead lifecycle and related records', async () => {
    const leadInput: CreateLeadInput = {
      partnerId: 'user-1',
      clientName: 'Acme Co',
      status: 'new',
      notes: [],
      files: [],
      createdBy: 'owner@example.com',
    };

    const lead = await storage.createLead(leadInput);
    expect(lead.id).toBeTruthy();
    expect(lead.status).toBe('new');

    const updated = await storage.updateLead(lead.id, {
      status: 'in_progress',
      notes: ['Updated scope'],
    });
    expect(updated.status).toBe('in_progress');
    expect(updated.notes).toContain('Updated scope');

    await storage.createLeadComment({
      leadId: lead.id,
      body: 'Initial comment',
      author: 'user@example.com',
    });
    const comments = await storage.listLeadComments({ leadId: lead.id });
    expect(comments).toHaveLength(1);

    await storage.createActivityLog({
      leadId: lead.id,
      action: 'Status updated',
      performedBy: 'user@example.com',
    });
    const logs = await storage.listActivityLogs({ leadId: lead.id });
    expect(logs).toHaveLength(1);

    await storage.deleteLead(lead.id);
    expect(await storage.getLead(lead.id)).toBeUndefined();
    expect(await storage.listLeadComments({ leadId: lead.id })).toHaveLength(0);
    expect(await storage.listActivityLogs({ leadId: lead.id })).toHaveLength(0);
  });

  it('creates and updates services', async () => {
    const serviceInput: CreateServiceInput = {
      name: 'Consulting',
      unit: 'hour',
      basePrice: 150,
    };

    const service = await storage.createService(serviceInput);
    expect(service.active).toBe(true);

    const updated = await storage.updateService(service.id, { active: false });
    expect(updated.active).toBe(false);

    const listed = await storage.listServices();
    expect(listed).toHaveLength(1);
  });
});
