import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LeadCard, getStatusColor, getStatusLabel } from '../LeadCard';
import { Lead } from '@/types';

vi.mock('@/contexts/GlobalizationContext', () => ({
  useGlobalization: () => ({
    formatDateTime: (date: Date) => date.toISOString(),
  }),
}));

const lead: Lead = {
  id: 'lead-1',
  partnerId: 'partner-1',
  clientName: 'Speedy Client',
  status: 'new',
  location: 'NYC',
  notes: [],
  files: [],
  createdBy: 'owner@example.com',
  createdAt: new Date('2024-02-01T00:00:00.000Z'),
  updatedAt: new Date('2024-02-02T00:00:00.000Z'),
};

describe('LeadCard', () => {
  it('calls handlers for view, edit, and delete actions', () => {
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<LeadCard lead={lead} onView={onView} onEdit={onEdit} onDelete={onDelete} />);

    const [viewButton, editButton, deleteButton] = screen.getAllByRole('button');

    fireEvent.click(viewButton);
    fireEvent.click(editButton);
    fireEvent.click(deleteButton);

    expect(onView).toHaveBeenCalledWith(lead);
    expect(onEdit).toHaveBeenCalledWith(lead);
    expect(onDelete).toHaveBeenCalledWith('lead-1');
  });

  it('exposes readable labels and badge styles per status', () => {
    expect(getStatusLabel('in_progress')).toBe('In Progress');
    expect(getStatusColor('completed')).toContain('green');
  });
});
