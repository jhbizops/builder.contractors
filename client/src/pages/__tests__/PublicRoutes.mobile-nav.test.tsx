import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import About from "@/pages/About";
import HowItWorks from "@/pages/HowItWorks";
import Pricing from "@/pages/Pricing";
import FAQ from "@/pages/FAQ";

vi.mock("@/contexts/GlobalizationContext", () => ({
  useGlobalization: () => ({
    settings: { locale: "en-US", currency: "USD", timeZone: "America/New_York" },
    geo: { country: null, localize: false },
    setGeoCountry: vi.fn(),
  }),
}));

const pages = [
  { name: "/about", component: <About /> },
  { name: "/how-it-works", component: <HowItWorks /> },
  { name: "/pricing", component: <Pricing /> },
  { name: "/faq", component: <FAQ /> },
];

describe("public routes mobile navigation", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            name: "United States",
            code: "US",
            currency: "USD",
            languages: ["en"],
            localize: false,
            proficiency: "high",
          },
        ],
      }),
    );
    Object.defineProperty(window, "innerWidth", { value: 390, configurable: true, writable: true });
    window.dispatchEvent(new Event("resize"));
  });

  it.each(pages)("keeps CTA actions accessible on $name at 390px", async ({ name, component }) => {
    window.history.pushState({}, "", name);
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });

    render(<QueryClientProvider client={client}>{component}</QueryClientProvider>);

    await user.click(screen.getByTestId("button-public-mobile-menu"));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("link", { name: "Sign In" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Get Started" })).toBeInTheDocument();
    expect(within(dialog).getByTestId("button-country-selector")).toBeInTheDocument();
  });
});
