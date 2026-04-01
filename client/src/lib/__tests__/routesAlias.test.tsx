import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router as WouterRouter } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { useLocation } from "wouter";
import { JobBoardAliasRedirect } from "@/App";
import { JOBS_ALIAS_PATH, JOBS_CANONICAL_PATH } from "@/lib/routes";

function LocationProbe() {
  const [location] = useLocation();
  return <span data-testid="location">{location}</span>;
}

describe("job board alias routing", () => {
  it("redirects /job-board to canonical jobs route", async () => {
    const memory = memoryLocation({ path: JOBS_ALIAS_PATH, record: true });

    render(
      <WouterRouter hook={memory.hook}>
        <JobBoardAliasRedirect />
        <LocationProbe />
      </WouterRouter>,
    );

    await waitFor(() => {
      expect(memory.history.at(-1)).toBe(JOBS_CANONICAL_PATH);
    });
  });
});
