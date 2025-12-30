import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SalesDashboard from '../SalesDashboard';

vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation" />,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select data-testid="status-select" value={value} onChange={(event) => onValueChange(event.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>
      {children}
    </option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: () => null,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/CountrySelector', () => ({
  CountrySelector: () => <div data-testid="country-selector" />,
}));

vi.mock('@/components/RegionFilter', () => ({
  RegionFilter: ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => (
    <select data-testid="region-filter" value={value} onChange={(event) => onValueChange(event.target.value)}>
      <option value="all">All Regions</option>
      <option value="emea">EMEA</option>
    </select>
  ),
}));

vi.mock('@/components/EntitlementGate', () => ({
  EntitlementGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/LeadCard', () => ({
  LeadCard: ({ lead }: any) => <div>{lead.clientName}</div>,
}));

vi.mock('@/components/modals/LeadModal', () => ({
  __esModule: true,
  default: ({ lead, isOpen }: { lead: any; isOpen: boolean }) =>
    isOpen ? <div data-testid="lead-modal">{lead.clientName}</div> : null,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 'user-1' },
    userData: { id: 'user-1', email: 'user@example.com', role: 'sales', entitlements: ['reports.export'], approved: true },
    loading: false,
  }),
}));

vi.mock('@/contexts/GlobalizationContext', () => ({
  useGlobalization: () => ({
    formatNumber: (value: number) => value.toString(),
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  const leads = [
    {
      id: 'lead-1',
      partnerId: 'p1',
      clientName: 'Lead One',
      status: 'new',
      notes: [],
      files: [],
      createdBy: 'user@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'lead-2',
      partnerId: 'p1',
      clientName: 'Lead Two',
      status: 'completed',
      notes: [],
      files: [],
      region: 'emea',
      createdBy: 'user@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return {
    ...actual,
    useQuery: () => ({ data: leads, isPending: false }),
    useMutation: () => ({ mutateAsync: vi.fn() }),
    useQueryClient: () => ({
      cancelQueries: vi.fn(),
      getQueryData: vi.fn().mockReturnValue(leads),
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
    }),
  };
});

describe('SalesDashboard performance paths', () => {
  it('renders memoised stats and respects filters', async () => {
    render(<SalesDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Leads')).toBeInTheDocument();
    });

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Lead One')).toBeInTheDocument();
    expect(screen.getByText('Lead Two')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('status-select'), { target: { value: 'completed' } });

    await waitFor(() => {
      expect(screen.queryByText('Lead One')).not.toBeInTheDocument();
      expect(screen.getByText('Lead Two')).toBeInTheDocument();
    });
  });
});
