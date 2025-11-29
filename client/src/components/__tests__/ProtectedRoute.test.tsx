import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ProtectedRoute } from "../ProtectedRoute";
import { AuthContext } from "@/contexts/AuthContext";
import type { User } from "@/types";

const baseUser: User = {
  id: "user-1",
  email: "user@example.com",
  role: "sales",
  approved: true,
  country: undefined,
  region: undefined,
  locale: undefined,
  currency: undefined,
  languages: [],
  createdAt: new Date(),
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
};

function renderWithAuth(user: User | null) {
  return render(
    <AuthContext.Provider
      value={{
        currentUser: user ? { id: user.id, email: user.email } : null,
        userData: user,
        loading: false,
        login: async () => {},
        register: async () => {},
        logout: async () => {},
      }}
    >
      <ProtectedRoute requiredEntitlement="reports.export">
        <div>secured</div>
      </ProtectedRoute>
    </AuthContext.Provider>,
  );
}

describe("ProtectedRoute", () => {
  it("blocks when entitlement is missing", () => {
    renderWithAuth(baseUser);
    expect(screen.getByText(/upgrade required/i)).toBeInTheDocument();
  });

  it("renders children when entitlement present", () => {
    renderWithAuth({ ...baseUser, entitlements: ["reports.export"] });
    expect(screen.getByText("secured")).toBeInTheDocument();
  });
});
