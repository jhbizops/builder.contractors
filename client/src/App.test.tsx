import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "./App";

describe("App router", () => {
  it("does not route /admin-setup when production guard is enabled", async () => {
    window.history.pushState({}, "", "/admin-setup");

    render(<Router enableAdminSetupRoute={false} />);

    expect(await screen.findByText("404 Page Not Found")).toBeInTheDocument();
  });
});
