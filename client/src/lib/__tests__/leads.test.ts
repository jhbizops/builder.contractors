import { describe, expect, it } from 'vitest';
import { calculateLeadStats, filterLeadsByStatusAndRegion } from '../leads';
import { Lead } from '@/types';

const baseLead: Lead = {
  id: '1',
  partnerId: 'partner-1',
  clientName: 'Example Client',
  status: 'new',
  notes: [],
  files: [],
  createdBy: 'user@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

describe('filterLeadsByStatusAndRegion', () => {
  it('filters by status and region when provided', () => {
    const leads: Lead[] = [
      baseLead,
      { ...baseLead, id: '2', status: 'completed', region: 'apac' },
      { ...baseLead, id: '3', status: 'in_progress', region: 'emea' },
    ];

    const filtered = filterLeadsByStatusAndRegion(leads, 'completed', 'apac');

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('2');
  });

  it('returns all leads when filters are set to all', () => {
    const leads: Lead[] = [baseLead, { ...baseLead, id: '2', status: 'completed' }];

    const filtered = filterLeadsByStatusAndRegion(leads, 'all', 'all');

    expect(filtered).toHaveLength(2);
  });
});

describe('calculateLeadStats', () => {
  it('counts leads by status', () => {
    const leads: Lead[] = [
      baseLead,
      { ...baseLead, id: '2', status: 'completed' },
      { ...baseLead, id: '3', status: 'completed' },
      { ...baseLead, id: '4', status: 'in_progress' },
    ];

    const stats = calculateLeadStats(leads);

    expect(stats).toEqual({
      totalLeads: 4,
      activeLeads: 1,
      completedLeads: 2,
      newLeads: 1,
    });
  });
});
