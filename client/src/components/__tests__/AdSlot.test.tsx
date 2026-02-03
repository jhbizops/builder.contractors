import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdSlot } from "../AdSlot";
import { getQueryFn } from "@/lib/queryClient";

describe("AdSlot", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const createClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
          queryFn: getQueryFn({ on401: "throw" }),
        },
      },
    });

  it("renders nothing when no creatives are available", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ creatives: [] }),
    });

    const client = createClient();
    const { container } = render(
      <QueryClientProvider client={client}>
        <AdSlot trade="plumbing" region="nsw" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders the first creative when available", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        creatives: [
          {
            id: "creative_1",
            adId: "ad_1",
            format: "banner",
            headline: "Save on roofing",
            body: "Limited time offer",
            assetUrl: "https://example.com/roofing.png",
            callToAction: "Get quote",
            metadata: {},
          },
        ],
      }),
    });

    const client = createClient();
    render(
      <QueryClientProvider client={client}>
        <AdSlot trade="roofing" region="nsw" />
      </QueryClientProvider>,
    );

    const slot = await screen.findByTestId("ad-slot");
    expect(slot).toBeInTheDocument();
    expect(await screen.findByText("Save on roofing")).toBeInTheDocument();
  });
});
