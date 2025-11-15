import { describe, expect, it } from 'vitest';
import { MemStorage } from '../storage';

describe('MemStorage', () => {
  it('deletes leads and raises a 404 error when missing', async () => {
    const storage = new MemStorage();
    const lead = await storage.createLead({
      partnerId: 'partner-1',
      clientName: 'Sample Lead',
      status: 'new',
      createdBy: 'admin@example.com',
    });

    await storage.deleteLead(lead.id);
    const leads = await storage.listLeads();
    expect(leads).toHaveLength(0);

    await expect(storage.deleteLead(lead.id)).rejects.toMatchObject({ status: 404 });
  });
});
