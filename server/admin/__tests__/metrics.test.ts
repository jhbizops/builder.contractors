import { beforeEach, describe, expect, it } from 'vitest';
import { MemStorage } from '../../storage';
import { calculateAdminMetrics } from '../metrics';

describe('calculateAdminMetrics', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  it('computes metrics using provided estimated lead values', async () => {
    await storage.createUser({ email: 'approved@example.com', role: 'builder', approved: true });
    await storage.createUser({ email: 'pending@example.com', role: 'sales', approved: false });

    await storage.createService({ id: 'svc-1', name: 'Design', unit: 'project', basePrice: 5000, active: true });
    await storage.createService({ id: 'svc-2', name: 'Audit', unit: 'project', basePrice: 10000, active: false });

    await storage.createLead({
      id: 'lead-1',
      partnerId: 'partner-1',
      clientName: 'Acme Corp',
      status: 'completed',
      createdBy: 'approved@example.com',
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
      updatedAt: new Date('2024-02-15T00:00:00.000Z'),
      estimatedValue: 20000,
      serviceId: 'svc-1',
    });

    await storage.createLead({
      id: 'lead-2',
      partnerId: 'partner-2',
      clientName: 'Globex',
      status: 'in_progress',
      createdBy: 'approved@example.com',
      createdAt: new Date('2024-02-10T00:00:00.000Z'),
    });

    await storage.createLead({
      id: 'lead-3',
      partnerId: 'partner-3',
      clientName: 'Old Lead',
      status: 'completed',
      createdBy: 'approved@example.com',
      createdAt: new Date('2023-12-01T00:00:00.000Z'),
      updatedAt: new Date('2023-12-15T00:00:00.000Z'),
      estimatedValue: 15000,
    });

    const metrics = await calculateAdminMetrics(storage, new Date('2024-02-20T00:00:00.000Z'));

    expect(metrics.totalUsers).toBe(2);
    expect(metrics.approvedUsers).toBe(1);
    expect(metrics.pendingApprovals).toBe(1);
    expect(metrics.totalLeads).toBe(3);
    expect(metrics.leadsByStatus.completed).toBe(2);
    expect(metrics.leadsByStatus.in_progress).toBe(1);
    expect(metrics.monthlyLeadVolume).toBe(2);
    expect(metrics.monthlyRevenue).toBe(20000);
    expect(metrics.averageDealSize).toBe(20000);
    expect(metrics.serviceCount).toBe(2);
    expect(metrics.activeServiceCount).toBe(1);
  });

  it('falls back to service pricing when lead revenue is missing', async () => {
    await storage.createUser({ email: 'owner@example.com', role: 'admin', approved: true });
    await storage.createService({ name: 'Consulting', unit: 'project', basePrice: 8000, active: true });

    await storage.createLead({
      partnerId: 'partner-9',
      clientName: 'No Value Lead',
      status: 'completed',
      createdBy: 'owner@example.com',
      createdAt: new Date('2024-02-02T00:00:00.000Z'),
      updatedAt: new Date('2024-02-03T00:00:00.000Z'),
    });

    const metrics = await calculateAdminMetrics(storage, new Date('2024-02-04T00:00:00.000Z'));

    expect(metrics.monthlyRevenue).toBe(8000);
    expect(metrics.averageDealSize).toBe(8000);
    expect(metrics.leadsByStatus.completed).toBe(1);
  });
});
