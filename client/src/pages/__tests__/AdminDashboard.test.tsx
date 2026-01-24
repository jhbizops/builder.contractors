import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AdminDashboard from "../AdminDashboard";
import { leadsQueryKey } from "@/api/leads";
import { adminMetricsQueryKey } from "@/api/admin";

const invalidateQueries = vi.fn();
const deleteMutation = vi.fn();

vi.mock("@/components/Navigation", () => ({
  Navigation: () => <div data-testid="navigation" />,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/UserApprovalPanel", () => ({
  UserApprovalPanel: () => <div data-testid="user-approval-panel" />,
}));

vi.mock("@/components/ServiceManagement", () => ({
  ServiceManagement: () => <div data-testid="service-management" />,
}));

vi.mock("@/components/LeadCard", () => ({
  LeadCard: ({ lead, onDelete }: { lead: { id: string; clientName: string }; onDelete: (id: string) => void }) => (
    <button type="button" onClick={() => onDelete(lead.id)}>
      Delete {lead.clientName}
    </button>
  ),
}));

vi.mock("@/components/modals/LeadModal", () => ({
  LeadModal: () => null,
}));

vi.mock("@/contexts/GlobalizationContext", () => ({
  useGlobalization: () => ({
    formatNumber: (value: number) => value.toString(),
    formatDualCurrency: (value: number) => `AUD ${value}`,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/api/leads", async () => {
  const actual = await vi.importActual<typeof import("@/api/leads")>("@/api/leads");
  return {
    ...actual,
    deleteLead: vi.fn().mockResolvedValue(undefined),
    updateLead: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/api/reports", () => ({
  createExport: vi.fn().mockResolvedValue({
    id: "export_1",
    status: "queued",
    filters: {},
    fileUrl: null,
    createdBy: "admin@example.com",
    tenantId: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

describe("AdminDashboard", () => {
  const leads = [
    {
      id: "lead-1",
      partnerId: "partner-1",
      clientName: "Lead One",
      status: "new",
      notes: [],
      files: [],
      createdBy: "admin@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  const metrics = {
    totalUsers: 5,
    activeLeads: 2,
    pendingApprovals: 1,
    monthlyRevenue: 240,
  };

  beforeEach(async () => {
    invalidateQueries.mockClear();
    deleteMutation.mockClear();
    const reactQuery = await import("@tanstack/react-query");

    vi.mocked(reactQuery.useQuery).mockImplementation(
      (({ queryKey }: { queryKey: unknown }) => {
        if (queryKey === leadsQueryKey) {
          return { data: leads };
        }
        if (queryKey === adminMetricsQueryKey) {
          return { data: metrics };
        }
        return { data: [] };
      }) as unknown as typeof reactQuery.useQuery,
    );

    vi.mocked(reactQuery.useQueryClient).mockReturnValue(
      {
        cancelQueries: vi.fn(),
        getQueryData: vi.fn().mockReturnValue(leads),
        setQueryData: vi.fn(),
        invalidateQueries,
      } as unknown as ReturnType<typeof reactQuery.useQueryClient>,
    );

    vi.mocked(reactQuery.useMutation).mockImplementation(
      ((options?: { mutationFn?: (variables: unknown) => Promise<unknown>; onSuccess?: (result: unknown, variables: unknown) => Promise<void> | void }) => ({
        mutateAsync: vi.fn(async (variables: unknown) => {
          if (typeof variables === "string") {
            deleteMutation(variables);
          }
          const result = await options?.mutationFn?.(variables);
          await options?.onSuccess?.(result, variables);
          return result;
        }),
        isPending: false,
      })) as unknown as typeof reactQuery.useMutation,
    );
  });

  it("renders metrics from the admin API", () => {
    render(<AdminDashboard />);

    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Active Leads")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Pending Approvals")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Monthly Revenue")).toBeInTheDocument();
    expect(screen.getByText("AUD 240")).toBeInTheDocument();
  });

  it("deletes leads via the API and refreshes cache", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminDashboard />);

    fireEvent.click(screen.getAllByText("Delete Lead One")[0]);

    await waitFor(() => {
      expect(deleteMutation).toHaveBeenCalledWith("lead-1");
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: leadsQueryKey });
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: adminMetricsQueryKey });
    });
  });
});
