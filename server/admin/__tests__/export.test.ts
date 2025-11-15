import { describe, expect, it } from 'vitest';
import type { StoredLead, StoredService } from '../../storage';
import {
  buildLeadsCsv,
  buildLeadsSpreadsheet,
  buildServicesCsv,
  buildServicesSpreadsheet,
} from '../export';

describe('admin export helpers', () => {
  const leadSample: StoredLead = {
    id: 'lead-1',
    partnerId: 'partner-1',
    clientName: 'Acme, Inc.',
    status: 'new',
    location: 'Sydney',
    country: 'AU',
    region: 'NSW',
    notes: [],
    files: [],
    createdBy: 'admin@example.com',
    updatedBy: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    estimatedValue: 12000,
    serviceId: 'svc-1',
  };

  const serviceSample: StoredService = {
    id: 'svc-1',
    name: 'Site Inspection',
    description: 'Detailed on-site inspection',
    unit: 'project',
    basePrice: 7500,
    imageUrl: null,
    active: true,
  };

  it('serialises leads to CSV with escaping', () => {
    const csv = buildLeadsCsv([leadSample]);
    const rows = csv.split('\n');

    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('Lead ID');
    expect(rows[1]).toContain('"Acme, Inc."');
    expect(rows[1]).toContain('12000');
  });

  it('serialises leads to spreadsheet XML', () => {
    const xml = buildLeadsSpreadsheet([leadSample]);
    expect(xml).toContain('<?xml version="1.0"?>');
    expect(xml).toContain('<Worksheet ss:Name="Leads">');
    expect(xml).toContain('Acme, Inc.');
    expect(xml).toContain('ss:Type="Number">12000</Data>');
  });

  it('serialises services to CSV and spreadsheet XML', () => {
    const csv = buildServicesCsv([serviceSample]);
    expect(csv.split('\n')[1]).toContain('Site Inspection');

    const xml = buildServicesSpreadsheet([serviceSample]);
    expect(xml).toContain('Services');
    expect(xml).toContain('ss:Type="Number">7500</Data>');
  });
});
