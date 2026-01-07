import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReportsPage from "@/pages/Reports";

const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/Navigation", () => ({
  Navigation: () => <nav>Navigation</nav>,
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/components/ui/select", () => {
  const flatten = (content: unknown): string => {
    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
      return content.map(flatten).join(" ");
    }
    if (React.isValidElement(content)) {
      const element = content as React.ReactElement<{ children?: React.ReactNode }>;
      const childContent = element.props.children as unknown;
      return childContent ? flatten(childContent) : "";
    }
    return "";
  };

  const SelectItem = ({ value, children }: any) => <option value={value}>{flatten(children)}</option>;

  const Select = ({ value, onValueChange, disabled, children, ...props }: any) => (
    <select
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      disabled={disabled}
      {...props}
    >
      {React.Children.toArray(children).flatMap((child) => {
        if (!React.isValidElement(child)) {
          return [];
        }

        if (child.type === SelectItem) {
          return child;
        }

        if (child.props?.children) {
          return React.Children.toArray(child.props.children).filter(
            (grandChild) => React.isValidElement(grandChild) && grandChild.type === SelectItem,
          );
        }

        return [];
      })}
    </select>
  );

  const SelectTrigger = ({ children }: any) => <>{children}</>;
  const SelectValue = ({ placeholder }: any) => <option value="">{placeholder}</option>;
  const SelectContent = ({ children }: any) => <>{children}</>;

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

describe("Reports page", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      currentUser: { id: "user-1", email: "user@example.com" },
      userData: {
        id: "user-1",
        email: "user@example.com",
        role: "sales",
        approved: true,
        entitlements: ["reports.export"],
      },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ exports: [] }) } as Response));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  const renderPage = () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <ReportsPage />
      </QueryClientProvider>,
    );
  };

  it("submits an export request successfully", async () => {
    const user = userEvent.setup();
    let exportsResponse: any[] = [];

    globalThis.fetch = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.url;
      const method = init?.method ?? "GET";

      if (url === "/api/reports/exports" && method === "GET") {
        return {
          ok: true,
          json: async () => ({ exports: exportsResponse }),
        } as Response;
      }

      if (url === "/api/reports/exports" && method === "POST") {
        exportsResponse = [
          {
            id: "export_123",
            status: "processing",
            filters: { report: "leads" },
            fileUrl: null,
            createdBy: "user-1",
            tenantId: "user-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        return {
          ok: true,
          json: async () => ({ export: exportsResponse[0] }),
        } as Response;
      }

      return { ok: true, json: async () => ({}) } as Response;
    });

    renderPage();

    const submitButton = screen.getByRole("button", { name: /generate export/i });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("export_123")).toBeInTheDocument();
    });
  });

  it("shows entitlement gating when missing access", () => {
    mockUseAuth.mockReturnValue({
      currentUser: { id: "user-1", email: "user@example.com" },
      userData: {
        id: "user-1",
        email: "user@example.com",
        role: "sales",
        approved: true,
        entitlements: [],
      },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    renderPage();

    expect(screen.getByText(/upgrade required/i)).toBeInTheDocument();
  });

  it("disables submission when inputs are invalid", async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ exports: [] }) } as Response));

    renderPage();

    const startInput = screen.getByLabelText(/start date/i);
    const endInput = screen.getByLabelText(/end date/i);

    fireEvent.change(startInput, { target: { value: "2024-05-10" } });
    fireEvent.change(endInput, { target: { value: "2024-05-01" } });

    expect(
      await screen.findByText(/end date must be on or after the start date/i),
    ).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: /generate export/i });
    expect(submitButton).toBeDisabled();
  });

  it("shows download button only for completed exports", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        exports: [
          {
            id: "export_ready",
            status: "completed",
            filters: { report: "jobs" },
            fileUrl: "/api/reports/exports/export_ready/download",
            createdBy: "user-1",
            tenantId: "user-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "export_processing",
            status: "processing",
            filters: { report: "leads" },
            fileUrl: null,
            createdBy: "user-1",
            tenantId: "user-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }),
    }) as Response);

    renderPage();

    expect(await screen.findByText("export_ready")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download/i })).toBeInTheDocument();
    expect(screen.queryByText("export_processing")).toBeInTheDocument();
  });
});
