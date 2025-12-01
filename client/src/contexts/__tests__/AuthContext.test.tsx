import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types";

const mockToast = vi.fn();
const mockRegister = vi.fn();
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockFetchCurrentUser = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

vi.mock("@/api/auth", () => ({
  registerUser: (...args: unknown[]) => mockRegister(...args),
  loginUser: (...args: unknown[]) => mockLogin(...args),
  logoutUser: (...args: unknown[]) => mockLogout(...args),
  fetchCurrentUser: () => mockFetchCurrentUser(),
}));

const createUser = (overrides: Partial<User> = {}): User => ({
  id: "user_1",
  email: "tester@example.com",
  role: "dual",
  approved: false,
  country: undefined,
  region: undefined,
  locale: undefined,
  currency: undefined,
  languages: [],
  createdAt: new Date("2024-01-01T00:00:00Z"),
  plan: {
    id: "free",
    name: "Free",
    description: "",
    interval: "month",
    priceCents: 0,
    currency: "usd",
    entitlements: ["dashboard.basic"],
    quotas: { leads: 10, seats: 1 },
    isDefault: true,
    providerPriceId: null,
  },
  subscription: null,
  entitlements: ["dashboard.basic"],
  quotas: { leads: 10, seats: 1 },
  ...overrides,
});

describe("AuthContext", () => {
  beforeEach(() => {
    mockToast.mockReset();
    mockRegister.mockReset();
    mockLogin.mockReset();
    mockLogout.mockReset();
    mockFetchCurrentUser.mockReset();
    mockFetchCurrentUser.mockResolvedValue(null);
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );

    return { wrapper, queryClient };
  };

  it("registers, logs out, and logs in users via API", async () => {
    const user = createUser();
    mockRegister.mockResolvedValue(user);
    mockLogin.mockResolvedValue(user);
    mockLogout.mockResolvedValue(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register("tester@example.com", "password123");
    });

    const registerArgs = mockRegister.mock.calls[0]?.[0];
    expect(registerArgs).toEqual({
      email: "tester@example.com",
      password: "password123",
      role: "dual",
      country: undefined,
      region: undefined,
      locale: undefined,
      currency: undefined,
      languages: undefined,
    });
    await waitFor(() => {
      expect(result.current.currentUser?.email).toBe("tester@example.com");
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.currentUser).toBeNull();
    });

    await act(async () => {
      await result.current.login("tester@example.com", "password123");
    });

    const loginArgs = mockLogin.mock.calls[0]?.[0];
    expect(loginArgs).toEqual({
      email: "tester@example.com",
      password: "password123",
    });
    await waitFor(() => {
      expect(result.current.currentUser?.email).toBe("tester@example.com");
    });
  });
});
